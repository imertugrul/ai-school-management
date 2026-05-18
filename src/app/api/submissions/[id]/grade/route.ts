import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { gradeAnswer } from '@/lib/grading'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import { logAiCall } from '@/lib/aiLogger'
import Anthropic from '@anthropic-ai/sdk'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const TEXT_AI_TYPES = new Set(['SHORT_ANSWER', 'ESSAY', 'CODE'])

function extractJson(text: string): any {
  const cleaned = text.replace(/```(?:json)?/g, '').trim()
  try { return JSON.parse(cleaned) } catch { /* fall through */ }
  const match = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (match) { try { return JSON.parse(match[0]) } catch { /* ignore */ } }
  return {}
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { schoolId: true },
    })

    const creditCheck = await checkAiCredits(user?.schoolId ?? null)
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: 'AI credit limit reached', creditsUsed: creditCheck.creditsUsed, creditsLimit: creditCheck.creditsLimit },
        { status: 429 }
      )
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        answers: true,
        test: { include: { questions: true } },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    let totalScore = 0
    let totalTokensUsed = 0

    // ── Pass 1: algorithmic / cached grading (no batched AI) ──
    const aiQueue: { question: typeof submission.test.questions[number]; answerId: string | null; response: string }[] = []

    for (const question of submission.test.questions) {
      const answer = submission.answers.find(a => a.questionId === question.id)

      // Empty answer → 0
      if (!answer || !answer.response) {
        await prisma.answer.upsert({
          where: { submissionId_questionId: { submissionId: submission.id, questionId: question.id } },
          create: { submissionId: submission.id, questionId: question.id, response: '', aiScore: 0, aiFeedback: 'Cevap verilmedi.', aiConfidence: 1.0 },
          update: { aiScore: 0, aiFeedback: 'Cevap verilmedi.', aiConfidence: 1.0 },
        })
        continue
      }

      // Defer text AI questions to batch pass
      if (TEXT_AI_TYPES.has(question.type) && anthropic) {
        aiQueue.push({ question, answerId: answer.id, response: answer.response })
        continue
      }

      const result = await gradeAnswer(
        { id: question.id, type: question.type, content: question.content, points: question.points, options: question.options, correctAnswer: question.correctAnswer || undefined, rubric: question.rubric, config: question.config },
        answer.response
      )

      totalScore += result.score
      totalTokensUsed += result.tokensUsed

      if (result.tokensUsed > 0 || result.cached) {
        await logAiCall({
          endpoint: '/api/submissions/[id]/grade',
          tokensUsed: result.tokensUsed,
          model: result.model,
          questionType: question.type,
          cached: result.cached ?? false,
          schoolId: user?.schoolId ?? null,
        })
      }

      await prisma.answer.update({
        where: { id: answer.id },
        data: { aiScore: result.score, aiFeedback: result.feedback, aiConfidence: result.confidence },
      })
    }

    // ── Pass 2: batch all SHORT_ANSWER / ESSAY / CODE into a single AI call ──
    if (aiQueue.length > 0 && anthropic) {
      const block = aiQueue.map((item, i) => {
        const q = item.question
        const rubric = q.rubric ? ` | Rubrik: ${typeof q.rubric === 'string' ? q.rubric : JSON.stringify(q.rubric)}` : ''
        const expected = q.correctAnswer ? ` | Beklenen: ${q.correctAnswer}` : ''
        return `Q${i} [${q.type}, max:${q.points}]: ${q.content}${expected}${rubric}\nCevap: ${item.response}`
      }).join('\n\n---\n\n')

      const maxTokens = Math.min(2000, 80 * aiQueue.length + 100)
      const systemPrompt = `Her soruyu değerlendir. Sadece JSON array: [{"q":num,"score":sayı,"feedback":"kısa","confidence":0-1}]`

      try {
        const response = await anthropic.messages.create({
          model: HAIKU_MODEL,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: block }],
        })
        const textBlock = response.content[0]
        const text = textBlock.type === 'text' ? textBlock.text : '[]'
        const raw = extractJson(text)
        const arr: any[] = Array.isArray(raw) ? raw : (raw.results ?? raw.grades ?? [])
        const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)
        totalTokensUsed += tokensUsed

        await logAiCall({
          endpoint: '/api/submissions/[id]/grade',
          tokensUsed,
          model: HAIKU_MODEL,
          questionType: 'BATCH',
          cached: false,
          schoolId: user?.schoolId ?? null,
        })

        for (let i = 0; i < aiQueue.length; i++) {
          const item = aiQueue[i]
          const graded = arr.find((g: any) => Number(g.q) === i) ?? arr[i]
          const score = Math.min(Number(graded?.score) || 0, item.question.points)
          const feedback = graded?.feedback || 'AI tarafından değerlendirildi.'
          const confidence = Number(graded?.confidence) || 0.7
          totalScore += score
          if (item.answerId) {
            await prisma.answer.update({
              where: { id: item.answerId },
              data: { aiScore: score, aiFeedback: feedback, aiConfidence: confidence },
            })
          }
        }
      } catch (err) {
        console.error('Batch AI grading error, falling back to individual:', err)
        for (const item of aiQueue) {
          const result = await gradeAnswer(
            { id: item.question.id, type: item.question.type, content: item.question.content, points: item.question.points, correctAnswer: item.question.correctAnswer || undefined, rubric: item.question.rubric, config: item.question.config },
            item.response,
          )
          totalScore += result.score
          totalTokensUsed += result.tokensUsed
          if (item.answerId) {
            await prisma.answer.update({
              where: { id: item.answerId },
              data: { aiScore: result.score, aiFeedback: result.feedback, aiConfidence: result.confidence },
            })
          }
        }
      }
    }

    await consumeAiCredits(user?.schoolId ?? null, totalTokensUsed)

    await prisma.submission.update({
      where: { id: params.id },
      data: { status: 'GRADED', totalScore, aiGraded: true },
    })

    return NextResponse.json({ success: true, totalScore, maxScore: submission.maxScore, tokensUsed: totalTokensUsed })

  } catch (error: any) {
    console.error('Grade error:', error)
    return NextResponse.json({ error: 'Failed to grade test' }, { status: 500 })
  }
}
