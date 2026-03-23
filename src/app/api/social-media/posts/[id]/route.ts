import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function getUser(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const post = await prisma.socialPost.findUnique({ where: { id: params.id } })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUser(session.user.email)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const { title, content, platforms, status, scheduledFor, tags, notes, mediaUrls } = body

    const existing = await prisma.socialPost.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const post = await prisma.socialPost.update({
      where: { id: params.id },
      data: {
        title:       title ?? null,
        content:     content ?? existing.content,
        platforms:   platforms ?? existing.platforms,
        status:      status ?? existing.status,
        scheduledFor: status === 'SCHEDULED' && scheduledFor ? new Date(scheduledFor) : status === 'SCHEDULED' ? existing.scheduledFor : null,
        publishedAt:  status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        tags:         tags ?? existing.tags,
        notes:        notes ?? null,
        mediaUrls:    mediaUrls !== undefined ? mediaUrls : existing.mediaUrls,
      },
    })

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUser(session.user.email)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const existing = await prisma.socialPost.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.socialPost.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
