import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { gradeAnswer } from '@/lib/grading'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get submission with answers and questions
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        answers: true,
        test: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    console.log('Starting AI grading...')

    let totalScore = 0

    // Grade each answer with AI
    for (const question of submission.test.questions) {
      // Find student's answer
      const answer = submission.answers.find(a => a.questionId === question.id)
      
      if (!answer || !answer.response) {
        // No answer - 0 points
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

      // Grade with AI
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

      // Save AI grading results
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

    // Update submission to GRADED (not released yet)
    await prisma.submission.update({
      where: { id: params.id },
      data: {
        status: 'GRADED',
        totalScore,
        aiGraded: true
      }
    })

    console.log(`AI Grading complete: ${totalScore}/${submission.maxScore}`)

    return NextResponse.json({ 
      success: true,
      totalScore,
      maxScore: submission.maxScore
    })

  } catch (error: any) {
    console.error('Grade error:', error)
    return NextResponse.json({ 
      error: 'Failed to grade test' 
    }, { status: 500 })
  }
}
