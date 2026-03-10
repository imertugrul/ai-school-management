import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { generateAccessCode } from '@/lib/generate-code'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, subject, description, questions, startDate, endDate, isActive } = body

    // Validate
    if (!title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title and questions are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create test with questions
    const test = await prisma.test.create({
      data: {
        title,
        subject: subject || null,
        description: description || null,
        createdById: user.id,
        isPublished: true,
        isActive: isActive || false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        accessCode: generateAccessCode(),
        questions: {
          create: questions.map((q: any, index: number) => ({
            orderIndex: index,
            type: q.type,
            content: q.content,
            points: q.points,
            options: q.options || null,
            correctAnswer: q.correctAnswer || null,
            rubric: q.rubric ? { criteria: q.rubric } : null,
          }))
        }
      },
      include: {
        questions: true
      }
    })

    return NextResponse.json({
      success: true,
      test
    })
  } catch (error: any) {
    console.error('Create test error:', error)
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    )
  }
}
