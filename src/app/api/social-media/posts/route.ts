import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const search       = searchParams.get('search')
    const from         = searchParams.get('from')
    const to           = searchParams.get('to')
    const limit        = parseInt(searchParams.get('limit') ?? '50')

    const where: any = { authorId: user.id }

    if (statusFilter) where.status = statusFilter
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { title:   { contains: search, mode: 'insensitive' } },
      ]
    }
    if (from || to) {
      where.OR = [
        ...(where.OR ?? []),
        from || to ? {
          scheduledFor: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to)   } : {}),
          }
        } : undefined,
        from || to ? {
          publishedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to)   } : {}),
          }
        } : undefined,
      ].filter(Boolean)
    }

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.socialPost.count({ where }),
    ])

    return NextResponse.json({ success: true, posts, total })
  } catch (error: any) {
    console.error('GET /api/social-media/posts error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const { title, content, platforms, status, scheduledFor, tags, notes, mediaUrls } = body

    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    if (!platforms?.length) return NextResponse.json({ error: 'Select at least one platform' }, { status: 400 })

    const post = await prisma.socialPost.create({
      data: {
        authorId:    user.id,
        title:       title ?? null,
        content,
        platforms,
        status:      status ?? 'DRAFT',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        publishedAt:  status === 'PUBLISHED' ? new Date() : null,
        tags:         tags ?? [],
        notes:        notes ?? null,
        mediaUrls:    mediaUrls ?? null,
      },
    })

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    console.error('POST /api/social-media/posts error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
