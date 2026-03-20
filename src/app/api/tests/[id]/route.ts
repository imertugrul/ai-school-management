import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions:     { orderBy: { orderIndex: 'asc' } },
        contentBlocks: { orderBy: { orderIndex: 'asc' } },
      }
    })

    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    return NextResponse.json({ success: true, test })
  } catch (error) {
    console.error('Get test error:', error)
    return NextResponse.json({ error: 'Failed to get test' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, subject, description, questions = [], contentBlocks = [], startDate, endDate, isActive } = body

    // Delete + recreate questions and content blocks
    await prisma.question.deleteMany({ where: { testId: params.id } })
    await prisma.contentBlock.deleteMany({ where: { testId: params.id } })

    const test = await prisma.test.update({
      where: { id: params.id },
      data: {
        title,
        subject:     subject     || null,
        description: description || null,
        startDate:   startDate   ? new Date(startDate) : null,
        endDate:     endDate     ? new Date(endDate)   : null,
        isActive:    isActive    || false,
        questions: {
          create: questions.map((q: any, i: number) => ({
            orderIndex:    i,
            type:          q.type,
            content:       q.content,
            points:        q.points        ?? 1,
            options:       q.options       ?? null,
            correctAnswer: q.correctAnswer ?? null,
            rubric:        q.rubric        ?? null,
            config:        q.config        ?? null,
            tags:          q.tags          ?? [],
          }))
        },
        contentBlocks: {
          create: contentBlocks.map((b: any) => ({
            type:       b.blockType,
            content:    b.content,
            orderIndex: b.orderIndex,
          }))
        },
      },
      include: { questions: true, contentBlocks: true }
    })

    return NextResponse.json({ success: true, test })
  } catch (error) {
    console.error('Update test error:', error)
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 })
  }
}
