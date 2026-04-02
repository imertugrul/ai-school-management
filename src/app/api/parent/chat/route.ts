import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import { handleApiError } from '@/lib/apiError'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        school: { select: { name: true, id: true, aiCreditsUsed: true, aiCreditsLimit: true } },
      },
    })
    if (!user || user.role !== 'PARENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const creditCheck = await checkAiCredits(user.schoolId ?? null)
    if (!creditCheck.allowed) {
      return NextResponse.json({ error: 'Günlük AI limiti doldu. Yarın tekrar deneyin.' }, { status: 429 })
    }

    const body = await request.json()
    const userMessage: string = body.message?.trim()
    if (!userMessage) return NextResponse.json({ error: 'Mesaj gereklidir' }, { status: 400 })

    // Fetch all children of this parent
    const children = await prisma.parentStudent.findMany({
      where: { parentId: user.id },
      include: {
        student: {
          include: {
            class: { select: { name: true } },
            studentGrades: {
              include: { component: { select: { weight: true, maxScore: true, course: { select: { name: true } } } } },
              take: 20,
            },
            attendanceRecords: {
              where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
              select: { status: true, date: true },
            },
            studentEnrollments: {
              include: { course: { select: { name: true, code: true } } },
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    })

    // Build student info for system prompt
    const studentInfo = children.map(c => {
      const s = c.student
      const grades = s.studentGrades
      let weightedSum = 0, totalWeight = 0
      for (const g of grades) {
        const pct = (g.score / g.component.maxScore) * 100
        weightedSum += pct * g.component.weight
        totalWeight += g.component.weight
      }
      const avg = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null
      const absences = s.attendanceRecords.filter(a => a.status === 'ABSENT').length
      const late     = s.attendanceRecords.filter(a => a.status === 'LATE').length
      const courses  = s.studentEnrollments.map(e => e.course.name).join(', ')
      return `- ${s.name} (${s.class?.name ?? 'Bilinmiyor'}): Not ortalaması: ${avg ?? 'yok'}, Son 30 gün devamsızlık: ${absences} gün, geç gelme: ${late} kez. Dersler: ${courses}`
    }).join('\n')

    // Fetch active documents summary
    const docs = await prisma.schoolDocument.findMany({
      where: {
        isActive: true,
        OR: [
          { schoolId: user.schoolId ?? undefined },
          { schoolId: null },
        ],
      },
      select: { title: true, description: true, category: true, fileUrl: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const docsSummary = docs.map(d => `- [${d.category.toUpperCase()}] ${d.title}${d.description ? ': ' + d.description : ''}`).join('\n')

    // Last 20 messages for context
    const history = await prisma.parentChatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })
    const contextMessages = history.slice(-20)

    const schoolName = user.school?.name ?? 'Okul'
    const parentName = user.name

    const systemPrompt = `Sen ${schoolName} okulunun AI asistanısın. Velilere yardımcı olmak için buradasın.

Veli: ${parentName}

Görevlerin:
1. Okul belgeleri ve yönetmelikler hakkında sorulara cevap ver
2. Öğrencinin akademik durumu hakkında bilgi ver (yalnızca bu velinin çocukları)
3. Randevu talebi almak (JSON formatında yanıt ver)
4. Okul politikaları hakkında bilgi ver
5. Cevaplayamadığın sorularda okul idaresine yönlendir

Velinin çocukları:
${studentInfo || '(Kayıtlı öğrenci bulunamadı)'}

Aktif okul belgeleri:
${docsSummary || '(Belge yüklenmemiş)'}

Kurallar:
- Velinin yazdığı dilde cevap ver (TR/EN/DE)
- Başka velilerin veya öğrencilerin bilgilerini asla paylaşma
- Finansal veya hukuki tavsiye verme
- Randevu talebi geldiğinde şu JSON'u yanıtının SONUNA ekle (Türkçe metin içinde):
  |||APPOINTMENT_REQUEST|||{"studentName":"...","subject":"...","preferredTime":"...","message":"..."}|||
- Samimi ve yardımsever ol
- Cevabını bilmiyorsan "Bu konuda okul idaresiyle iletişime geçmenizi öneririm" de`

    const messages: Anthropic.MessageParam[] = [
      ...contextMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: userMessage },
    ]

    // Save user message
    await prisma.parentChatMessage.create({
      data: { userId: user.id, role: 'user', content: userMessage },
    })

    let fullResponse = ''
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const aiStream = anthropic.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            messages,
          })

          for await (const event of aiStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullResponse += event.delta.text
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }

          // Save AI response
          await prisma.parentChatMessage.create({
            data: { userId: user.id, role: 'assistant', content: fullResponse },
          })

          // Keep only last 100 messages per parent
          const allMessages = await prisma.parentChatMessage.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'asc' },
          })
          if (allMessages.length > 100) {
            const toDelete = allMessages.slice(0, allMessages.length - 100).map(m => m.id)
            await prisma.parentChatMessage.deleteMany({ where: { id: { in: toDelete } } })
          }

          // Handle appointment request if detected
          const apptMatch = fullResponse.match(/\|\|\|APPOINTMENT_REQUEST\|\|\|(.+?)\|\|\|/)
          if (apptMatch) {
            try {
              const apptData = JSON.parse(apptMatch[1])
              await prisma.appointmentRequest.create({
                data: {
                  parentId: user.id,
                  studentName: apptData.studentName ?? '',
                  subject: apptData.subject ?? '',
                  message: apptData.message ?? userMessage,
                  preferredTime: apptData.preferredTime ?? null,
                },
              })
            } catch {}
          }

          await consumeAiCredits(user.schoolId ?? null, 1)
          controller.close()
        } catch (err) {
          console.error('Parent chat stream error:', err)
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    return handleApiError(error, 'parent/chat')
  }
}
