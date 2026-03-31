import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { generateAccessCode } from '@/lib/generate-code'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const { title, subject, description, questions = [], contentBlocks = [], startDate, endDate, isActive, saveToLibrary } = body

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const test = await prisma.test.create({
      data: {
        title,
        subject:     subject     || null,
        description: description || null,
        createdById: user.id,
        isPublished: true,
        isActive:    isActive    || false,
        status:      'DRAFT',
        startDate:   startDate   ? new Date(startDate) : null,
        endDate:     endDate     ? new Date(endDate)   : null,
        accessCode:  generateAccessCode(),
        questions: {
          create: questions.map((q: any, i: number) => ({
            orderIndex:    i,
            type:          q.type,
            content:       q.content,
            points:        q.points      ?? 1,
            options:       q.options     ?? null,
            correctAnswer: q.correctAnswer ?? null,
            rubric:        q.rubric      ? { criteria: q.rubric } : null,
            config:        q.config      ?? null,
            tags:          q.tags        ?? [],
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

    // Auto-save questions to library if requested
    if (saveToLibrary && questions.length > 0) {
      await prisma.libraryQuestion.createMany({
        data: questions.map((q: any) => ({
          teacherId:     user.id,
          type:          q.type,
          content:       q.content,
          points:        q.points      ?? 1,
          options:       q.options     ?? null,
          correctAnswer: q.correctAnswer ?? null,
          rubric:        q.rubric      ? { criteria: q.rubric } : null,
          config:        q.config      ?? null,
          tags:          q.tags        ?? [],
          subject:       subject       ?? null,
        })),
        skipDuplicates: false,
      })
    }

    return NextResponse.json({ success: true, test })
  } catch (error: any) {
    console.error('Create test error:', error)
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
  }
}
