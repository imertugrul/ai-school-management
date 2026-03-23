import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { batchGradeQuestion } from '@/lib/grading'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import { logAiCall } from '@/lib/aiLogger'

/**
 * POST /api/tests/[id]/grade-all
 * Grades all SUBMITTED submissions for a test using batch AI grading.
 * For each question, sends ALL students' answers in a single API call
 * instead of one call per student (saves tokens and time).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, schoolId: true },
    })

    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Teacher or Admin access required' }, { status: 403 })
    }

    // ── Credit check ──
    const creditCheck = await checkAiCredits(user.schoolId ?? null)
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: 'AI credit limit reached', creditsUsed: creditCheck.creditsUsed, creditsLimit: creditCheck.creditsLimit },
        { status: 429 }
      )
    }

    // Fetch test with questions and all submitted/ungraded submissions
    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        submissions: {
          where: { status: 'SUBMITTED' },
          include: { answers: true },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    if (test.submissions.length === 0) {
      return NextResponse.json({ success: true, message: 'No submissions to grade', gradedCount: 0 })
    }

    let totalTokensUsed = 0
    const submissionScores: Record<string, number> = {}

    // Initialize scores for each submission
    test.submissions.forEach(s => { submissionScores[s.id] = 0 })

    // ── For each question: batch grade all students at once ──
    for (const question of test.questions) {
      // Build list of student answers for this question
      const studentAnswers = test.submissions
        .map((submission, idx) => {
          const answer = submission.answers.find(a => a.questionId === question.id)
          return {
            studentIndex: idx,
            submissionId: submission.id,
            answerId: answer?.id ?? null,
            answer: answer?.response ?? '',
          }
        })
        .filter(sa => sa.answer.trim() !== '' || sa.answerId !== null)

      if (studentAnswers.length === 0) continue

      const { results, tokensUsed } = await batchGradeQuestion(
        {
          type: question.type,
          content: question.content,
          points: question.points,
          correctAnswer: question.correctAnswer ?? undefined,
          rubric: question.rubric,
        },
        studentAnswers.map(sa => ({ studentIndex: sa.studentIndex, answer: sa.answer }))
      )

      totalTokensUsed += tokensUsed

      // Save results and accumulate scores
      for (const result of results) {
        const sa = studentAnswers[result.studentIndex]
        if (!sa) continue

        submissionScores[sa.submissionId] = (submissionScores[sa.submissionId] ?? 0) + result.score

        if (sa.answerId) {
          await prisma.answer.update({
            where: { id: sa.answerId },
            data: {
              aiScore: result.score,
              aiFeedback: result.feedback,
              aiConfidence: result.confidence,
            },
          })
        } else {
          // Create answer record with score 0 if no answer was given
          await prisma.answer.upsert({
            where: {
              submissionId_questionId: {
                submissionId: sa.submissionId,
                questionId: question.id,
              },
            },
            create: {
              submissionId: sa.submissionId,
              questionId: question.id,
              response: '',
              aiScore: 0,
              aiFeedback: 'No answer provided',
              aiConfidence: 1.0,
            },
            update: {
              aiScore: 0,
              aiFeedback: 'No answer provided',
              aiConfidence: 1.0,
            },
          })
        }
      }
    }

    // ── Update all submissions to GRADED ──
    await Promise.all(
      test.submissions.map(s =>
        prisma.submission.update({
          where: { id: s.id },
          data: {
            status: 'GRADED',
            totalScore: submissionScores[s.id] ?? 0,
            aiGraded: true,
          },
        })
      )
    )

    // ── Consume credits + audit log ──
    await consumeAiCredits(user.schoolId ?? null, totalTokensUsed)
    await logAiCall({ endpoint: '/api/tests/[id]/grade-all', tokensUsed: totalTokensUsed, hasPersonalData: false })

    return NextResponse.json({
      success: true,
      gradedCount: test.submissions.length,
      questionsProcessed: test.questions.length,
      tokensUsed: totalTokensUsed,
    })

  } catch (error: any) {
    console.error('Batch grade error:', error)
    return NextResponse.json({ error: error.message || 'Failed to grade submissions' }, { status: 500 })
  }
}
