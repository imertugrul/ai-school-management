import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search  = searchParams.get('search')  || ''
    const type    = searchParams.get('type')    || ''
    const subject = searchParams.get('subject') || ''
    const tag     = searchParams.get('tag')     || ''

    const questions = await prisma.libraryQuestion.findMany({
      where: {
        teacherId: user.id,
        ...(type    ? { type: type as any }    : {}),
        ...(subject ? { subject }               : {}),
        ...(tag     ? { tags: { has: tag } }    : {}),
        ...(search  ? { content: { contains: search, mode: 'insensitive' as any } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ success: true, questions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { type, content, points, options, correctAnswer, rubric, config, tags, subject } = body

    const q = await prisma.libraryQuestion.create({
      data: {
        teacherId: user.id,
        type,
        content,
        points: points ?? 1,
        options: options ?? null,
        correctAnswer: correctAnswer ?? null,
        rubric: rubric ?? null,
        config: config ?? null,
        tags: tags ?? [],
        subject: subject ?? null,
      }
    })

    return NextResponse.json({ success: true, question: q })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
