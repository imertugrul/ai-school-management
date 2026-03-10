import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teacherScore, teacherFeedback } = await request.json()

    // Update answer
    const answer = await prisma.answer.update({
      where: { id: params.id },
      data: {
        teacherScore: teacherScore !== null ? parseFloat(teacherScore) : null,
        teacherFeedback: teacherFeedback || null
      },
      include: {
        question: true,
        submission: true
      }
    })

    // Recalculate total score for the submission
    const allAnswers = await prisma.answer.findMany({
      where: { submissionId: answer.submissionId },
      include: { question: true }
    })

    const totalScore = allAnswers.reduce((sum, ans) => {
      // Use teacherScore if available, otherwise aiScore
      const score = ans.teacherScore !== null ? ans.teacherScore : (ans.aiScore || 0)
      return sum + score
    }, 0)

    // Update submission total score
    await prisma.submission.update({
      where: { id: answer.submissionId },
      data: { totalScore }
    })

    return NextResponse.json({ 
      success: true,
      answer,
      totalScore
    })

  } catch (error: any) {
    console.error('Update answer error:', error)
    return NextResponse.json({ 
      error: 'Failed to update answer' 
    }, { status: 500 })
  }
}
