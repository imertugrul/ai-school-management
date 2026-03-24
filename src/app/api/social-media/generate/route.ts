import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import { logAiCall } from '@/lib/aiLogger'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const creditCheck = await checkAiCredits(user.schoolId ?? null)
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: 'AI kredi limitinize ulaştınız. Lütfen yöneticinizle iletişime geçin.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { topic, contentTypes, platforms, tone, language, emojiLevel } = body as {
      topic: string
      contentTypes: string[]
      platforms: string[]
      tone: string
      language: string
      emojiLevel: string
    }

    if (!topic?.trim()) return NextResponse.json({ error: 'Konu gereklidir' }, { status: 400 })
    if (!platforms?.length) return NextResponse.json({ error: 'En az bir platform seçin' }, { status: 400 })

    const brandSettings = user.schoolId
      ? await prisma.brandSettings.findUnique({ where: { schoolId: user.schoolId } })
      : null

    const systemPrompt = `Sen bir okul/eğitim kurumu için sosyal medya uzmanısın. KVKK uyumlu, öğrenci kimliği içermeyen içerikler üretirsin.
${brandSettings ? `Okul: ${brandSettings.organizationName}\nSes tonu: ${brandSettings.voiceTone}\nZorunlu hashtag'ler: ${brandSettings.hashtags?.join(' ')}\nYasak kelimeler: ${brandSettings.forbiddenWords?.join(', ')}` : ''}
Yanıtını SADECE JSON formatında ver, başka hiçbir şey ekleme.`

    const userPrompt = `Konu: ${topic}
İçerik türü: ${contentTypes.join(', ')}
Ton: ${tone}
Dil: ${language}
Emoji seviyesi: ${emojiLevel}

Aşağıdaki platformlar için içerik üret ve JSON olarak döndür:
${platforms.includes('INSTAGRAM') ? '- instagram: { caption: string, hashtags: string[], imagePrompt: string }' : ''}
${platforms.includes('TWITTER') ? '- twitter: { tweet: string (max 280 chars), thread: string[] }' : ''}
${platforms.includes('FACEBOOK') ? '- facebook: { content: string }' : ''}
${platforms.includes('LINKEDIN') ? '- linkedin: { hook: string, content: string, hashtags: string[] }' : ''}
${platforms.includes('TIKTOK') ? '- tiktok: { hook: string, description: string, hashtags: string[], soundSuggestion: string }' : ''}

Instagram caption max 2200 karakter, Twitter max 280 karakter, LinkedIn max 3000 karakter.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    })

    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens

    await consumeAiCredits(user.schoolId ?? null, tokensUsed)
    await logAiCall({ endpoint: 'social-media/generate', tokensUsed, hasPersonalData: false })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    let generated: Record<string, unknown>
    try {
      generated = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          generated = JSON.parse(jsonMatch[0])
        } catch {
          return NextResponse.json({ error: 'AI yanıtı ayrıştırılamadı' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: 'AI yanıtı JSON formatında değil' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, generated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('POST /api/social-media/generate error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
