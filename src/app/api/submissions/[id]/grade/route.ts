import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { gradeAnswer } from '@/lib/grading'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import { logAiCall } from '@/lib/aiLogger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user for school credit tracking
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { schoolId: true },
    })

    // ── Credit check ──
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
        test: {
          include: { questions: true }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    console.log('Starting AI grading...')

    let totalScore = 0
    let totalTokensUsed = 0

    for (const question of submission.test.questions) {
      const answer = submission.answers.find(a => a.questionId === question.id)

      if (!answer || !answer.response) {
        await prisma.answer.upsert({
          where: {
            submissionId_questionId: {
              submissionId: submission.id,
              questionId: question.id
            }
          },
          create: {
            submissionId: submission.id,
            questionId: question.id,
            response: '',
            aiScore: 0,
            aiFeedback: 'No answer provided',
            aiConfidence: 1.0
          },
          update: {
            aiScore: 0,
            aiFeedback: 'No answer provided',
            aiConfidence: 1.0
          }
        })
        continue
      }

      console.log(`Grading question ${question.id}...`)

      const gradingResult = await gradeAnswer(
        {
          type: question.type,
          content: question.content,
          points: question.points,
          options: question.options,
          correctAnswer: question.correctAnswer || undefined,
          rubric: question.rubric
        },
        answer.response
      )

      totalScore += gradingResult.score
      totalTokensUsed += gradingResult.tokensUsed

      await prisma.answer.update({
        where: { id: answer.id },
        data: {
          aiScore: gradingResult.score,
          aiFeedback: gradingResult.feedback,
          aiConfidence: gradingResult.confidence
        }
      })

      console.log(`Question ${question.id}: ${gradingResult.score}/${gradingResult.maxScore}`)
    }

    // ── Consume credits + audit log ──
    await consumeAiCredits(user?.schoolId ?? null, totalTokensUsed)
    await logAiCall({ endpoint: '/api/submissions/[id]/grade', tokensUsed: totalTokensUsed, hasPersonalData: false })

    await prisma.submission.update({
      where: { id: params.id },
      data: {
        status: 'GRADED',
        totalScore,
        aiGraded: true
      }
    })

    console.log(`AI Grading complete: ${totalScore} points, ${totalTokensUsed} tokens used`)

    return NextResponse.json({
      success: true,
      totalScore,
      maxScore: submission.maxScore,
      tokensUsed: totalTokensUsed,
    })

  } catch (error: any) {
    console.error('Grade error:', error)
    return NextResponse.json({ error: 'Failed to grade test' }, { status: 500 })
  }
}
