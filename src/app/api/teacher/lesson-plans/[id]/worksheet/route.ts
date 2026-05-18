import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import { logAiCall } from '@/lib/aiLogger'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-4-6'
const DAILY_LIMIT = 10
const ENDPOINT = '/api/teacher/lesson-plans/[id]/worksheet'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const SYSTEM_PROMPT = 'Sen deneyimli bir öğretmensin. Verilen ders planına dayalı worksheet oluştur. SADECE geçerli JSON döndür — açıklama, yorum, markdown veya kod bloğu ekleme.'

const VALID_TYPES = new Set(['practice', 'activity', 'reading', 'notes'])

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1].trim()) } catch { /* fall through */ }
  }
  const braceStart = text.indexOf('{')
  const braceEnd = text.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)) } catch { /* fall through */ }
  }
  try { return JSON.parse(text.trim()) } catch { /* fall through */ }
  console.error('Worksheet JSON parse failed. Raw response (first 2000 chars):', text.slice(0, 2000))
  return null
}

function safeArr<T>(s: string | null, fallback: T[]): T[] {
  if (!s) return fallback
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : fallback } catch { return fallback }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    if (!anthropic) {
      return NextResponse.json({ error: 'AI servisi yapılandırılmamış (ANTHROPIC_API_KEY eksik).' }, { status: 500 })
    }

    // ── Daily per-teacher limit (10/day) ──
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayCount = await prisma.aiLog.count({
      where: { userId: teacher.id, endpoint: ENDPOINT, createdAt: { gte: startOfDay } },
    })
    if (todayCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Günlük worksheet limitiniz doldu (${DAILY_LIMIT}/gün). Yarın tekrar deneyin.`, used: todayCount, limit: DAILY_LIMIT },
        { status: 429 }
      )
    }

    // ── School credit check ──
    const creditCheck = await checkAiCredits(teacher.schoolId ?? null)
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: 'AI credit limit reached', creditsUsed: creditCheck.creditsUsed, creditsLimit: creditCheck.creditsLimit },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const types: string[] = Array.isArray(body.types) ? body.types.filter((t: string) => VALID_TYPES.has(t)) : []
    const language: 'tr' | 'en' = body.language === 'en' ? 'en' : 'tr'
    const questionCount: number = Math.min(Math.max(Number(body.questionCount) || 5, 1), 20)

    if (types.length === 0) {
      return NextResponse.json({ error: 'En az bir worksheet tipi seçmelisiniz.' }, { status: 400 })
    }

    const plan = await prisma.lessonPlan.findFirst({
      where: { id: params.id, teacherId: teacher.id },
      include: { course: { select: { name: true, code: true, grade: true } } },
    })
    if (!plan) {
      return NextResponse.json({ error: 'Ders planı bulunamadı.' }, { status: 404 })
    }

    const objectives = plan.isAIGenerated ? safeArr<string>(plan.learningObjectives, []) : (plan.objectives ? plan.objectives.split('\n').filter(Boolean) : [])
    const slides = safeArr<{ title: string; content: string[] }>(plan.slideOutline, [])
    const slideText = slides.length
      ? slides.map((s, i) => `${i + 1}. ${s.title}: ${(s.content || []).join('; ')}`).join('\n')
      : (plan.activities || '').slice(0, 1000)

    const sections: string[] = []
    if (types.includes('practice')) {
      sections.push(`ALIŞTIRMA SORULARI (${questionCount} soru): MCQ, kısa cevap ve doğru/yanlış karışık.`)
    }
    if (types.includes('activity')) {
      sections.push('ETKİNLİK SAYFASI: 2-3 doldurulabilir aktivite, öğrenci için boşluk bırak.')
    }
    if (types.includes('reading')) {
      sections.push('OKUMA METNİ + SORULAR: 150-200 kelimelik metin ve 3-5 anlama sorusu.')
    }
    if (types.includes('notes')) {
      sections.push('NOT ALMA ŞABLONU: Ana kavramlar, önemli noktalar, sorular ve özet bölümleri (her bölüm için satır sayısı).')
    }

    const langLabel = language === 'tr' ? 'Türkçe' : 'İngilizce'

    const userPrompt = `Ders Planı:
Konu: ${plan.unitName || plan.title}
Sınıf: ${plan.course.grade || 'belirtilmedi'} (${plan.course.code} — ${plan.course.name})
Müfredat: ${plan.curriculumType || 'belirtilmedi'}
Kazanımlar: ${objectives.join(' | ') || 'belirtilmedi'}
İçerik özeti:
${slideText || '(içerik özeti yok)'}

Aşağıdaki bölümleri içeren bir worksheet oluştur:
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Tüm metinler ${langLabel} olsun.

Tam olarak şu şemada JSON döndür (sadece seçilen bölümler için key ekle, diğerlerini hiç koyma):
{
  ${types.includes('practice') ? `"practice": {
    "questions": [
      { "type": "mcq", "question": "...", "options": ["...","...","...","..."], "answer": "..." },
      { "type": "short", "question": "...", "answer": "..." },
      { "type": "truefalse", "question": "...", "answer": "true" }
    ]
  }${types.length > 1 ? ',' : ''}` : ''}
  ${types.includes('activity') ? `"activity": {
    "activities": [
      { "title": "...", "instructions": "...", "studentSpace": "..." }
    ]
  }${(types.includes('reading') || types.includes('notes')) ? ',' : ''}` : ''}
  ${types.includes('reading') ? `"reading": {
    "text": "...",
    "questions": [
      { "question": "...", "answer": "..." }
    ]
  }${types.includes('notes') ? ',' : ''}` : ''}
  ${types.includes('notes') ? `"notes": {
    "sections": [
      { "title": "...", "lines": 4 }
    ]
  }` : ''}
}

SADECE geçerli JSON döndür, başka hiçbir metin ekleme.`

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)
    console.log(`[lesson-plans/worksheet] model=${MODEL} stop_reason=${response.stop_reason} input=${response.usage?.input_tokens} output=${response.usage?.output_tokens}`)

    const content = response.content[0]
    if (content.type !== 'text') {
      await logAiCall({ endpoint: ENDPOINT, tokensUsed, model: MODEL, questionType: 'worksheet', schoolId: teacher.schoolId ?? null, userId: teacher.id })
      return NextResponse.json({ error: 'AI yanıtı geçersiz format döndürdü.' }, { status: 500 })
    }

    const truncated = response.stop_reason === 'max_tokens'
    const parsed = extractJson(content.text)
    if (!parsed) {
      await logAiCall({ endpoint: ENDPOINT, tokensUsed, model: MODEL, questionType: 'worksheet', schoolId: teacher.schoolId ?? null, userId: teacher.id })
      return NextResponse.json({ error: truncated ? 'AI yanıtı çok uzun (kesildi). Daha az soru ile deneyin.' : 'AI yanıtı ayrıştırılamadı. Lütfen tekrar deneyin.' }, { status: 500 })
    }

    await consumeAiCredits(teacher.schoolId ?? null, tokensUsed)
    await logAiCall({
      endpoint: ENDPOINT,
      tokensUsed,
      model: MODEL,
      questionType: 'worksheet',
      schoolId: teacher.schoolId ?? null,
      userId: teacher.id,
    })

    const topic = plan.unitName || plan.title
    const saved = await prisma.worksheet.create({
      data: {
        title: `${topic} - Worksheet`,
        topic,
        grade: plan.course.grade ?? null,
        curriculum: plan.curriculumType ?? null,
        language,
        types,
        content: parsed,
        teacherId: teacher.id,
        lessonPlanId: plan.id,
        schoolId: teacher.schoolId ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      worksheetId: saved.id,
      worksheet: parsed,
      truncated,
      dailyUsage: { used: todayCount + 1, limit: DAILY_LIMIT },
      meta: {
        title: saved.title,
        unitName: topic,
        courseCode: plan.course.code,
        courseName: plan.course.name,
        grade: plan.course.grade,
        curriculumType: plan.curriculumType,
        language,
      },
    })

  } catch (error: any) {
    console.error('Worksheet generation error:', error)
    const message = error?.error?.message || error?.message || 'Worksheet oluşturulamadı.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
