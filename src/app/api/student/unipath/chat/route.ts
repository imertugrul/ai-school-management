import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import { UNIPATH_MASTER_PROMPT } from '@/lib/unipath/masterPrompt'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ChatMessage = { role: 'user' | 'assistant'; content: string; timestamp: string }

function parseProfileUpdates(text: string, currentProfile: any): Partial<any> {
  const updates: Partial<any> = {}

  // Simple heuristic extraction — look for key patterns in AI response
  // These are best-effort, non-breaking
  try {
    // GPA mentions
    const gpaMatch = text.match(/gpa[:\s]+([0-9]+\.?[0-9]*)/i)
    if (gpaMatch && !currentProfile?.gpa) updates.gpa = parseFloat(gpaMatch[1])

    // SAT score
    const satMatch = text.match(/sat[:\s]+([0-9]{3,4})/i)
    if (satMatch) {
      const examScores = { ...(currentProfile?.examScores as object ?? {}), SAT: parseInt(satMatch[1]) }
      updates.examScores = examScores
    }

    // TOEFL score
    const toeflMatch = text.match(/toefl[:\s]+([0-9]{2,3})/i)
    if (toeflMatch) {
      const examScores = { ...(currentProfile?.examScores as object ?? {}), TOEFL: parseInt(toeflMatch[1]) }
      updates.examScores = examScores
    }
  } catch {}

  return updates
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        class: { select: { grade: true, name: true } },
        school: { select: { name: true, id: true, aiCreditsUsed: true, aiCreditsLimit: true } },
      },
    })
    if (!user || user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (user.class?.grade !== '9') return NextResponse.json({ error: 'UniPath is only available for 9th grade students' }, { status: 403 })

    // Credit check
    const creditCheck = await checkAiCredits(user.schoolId ?? null)
    if (!creditCheck.allowed) {
      return NextResponse.json({ error: 'Daily AI limit reached. Try again tomorrow or ask your admin.' }, { status: 429 })
    }

    const body = await request.json()
    const userMessage: string = body.message?.trim()
    if (!userMessage) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // Get or create university profile
    let profile = await prisma.universityProfile.findUnique({ where: { studentId: user.id } })
    if (!profile) {
      profile = await prisma.universityProfile.create({ data: { studentId: user.id } })
    }

    // Chat history — keep last 20 messages for context
    const history: ChatMessage[] = (profile.chatHistory as ChatMessage[] | null) ?? []
    const contextMessages = history.slice(-20)

    // Build system prompt with student context
    const systemPrompt = `${UNIPATH_MASTER_PROMPT}

---
CURRENT STUDENT PROFILE:
Name: ${user.name}
Class: ${user.class?.name ?? 'Unknown'} (Grade 9)
School: ${user.school?.name ?? 'Unknown'}

Known profile data:
${JSON.stringify({
  targetRegion: profile.targetRegion,
  educationLevel: profile.educationLevel,
  startYear: profile.startYear,
  fieldOfInterest: profile.fieldOfInterest,
  scholarshipNeeded: profile.scholarshipNeeded,
  diplomaSystem: profile.diplomaSystem,
  gpa: profile.gpa,
  examScores: profile.examScores,
  universityList: profile.universityList,
}, null, 2)}

Use this context to personalize your responses. If the student mentions new information (GPA, test scores, target schools), incorporate it naturally.`

    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = [
      ...contextMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ]

    // Add user message to history immediately
    const newUserMsg: ChatMessage = { role: 'user', content: userMessage, timestamp: new Date().toISOString() }
    const updatedHistory = [...history, newUserMsg]

    // Stream the response
    let fullResponse = ''

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = anthropic.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1000,
            system: systemPrompt,
            messages,
          })

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullResponse += event.delta.text
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }

          // Save AI response to history + consume credit
          const aiMsg: ChatMessage = { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() }
          const finalHistory = [...updatedHistory, aiMsg].slice(-50) // Keep last 50 messages

          // Parse any profile updates from the conversation
          const profileUpdates = parseProfileUpdates(userMessage, profile)

          await prisma.universityProfile.update({
            where: { studentId: user.id },
            data: {
              chatHistory: finalHistory,
              ...(Object.keys(profileUpdates).length > 0 ? profileUpdates : {}),
            },
          })

          await consumeAiCredits(user.schoolId ?? null, 1)

          controller.close()
        } catch (err) {
          console.error('UniPath stream error:', err)
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
    console.error('UniPath chat error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
