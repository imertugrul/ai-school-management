import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, test })
  } catch (error) {
    console.error('Get test error:', error)
    return NextResponse.json({ error: 'Failed to get test' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, subject, description, questions, startDate, endDate, isActive } = body


    // Delete existing questions
    await prisma.question.deleteMany({
      where: { testId: params.id }
    })

    // Update test with new questions
    const test = await prisma.test.update({
      where: { id: params.id },
      data: {
        title,
        subject: subject || null,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive || false,

        questions: {
          create: questions.map((q: any) => ({
            orderIndex: q.orderIndex,
            type: q.type,
            content: q.content,
            points: q.points,
            options: q.options || null,
            correctAnswer: q.correctAnswer || null,
            rubric: q.rubric || null,
          }))
        }
      },
      include: {
        questions: true
      }
    })

    return NextResponse.json({ success: true, test })
  } catch (error) {
    console.error('Update test error:', error)
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 })
  }
}
