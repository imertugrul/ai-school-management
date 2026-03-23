import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()

    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId: user.schoolId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
        targetClass: { select: { id: true, name: true } }
      },
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, announcements })
  } catch (error) {
    console.error('Announcements GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const canCreate = ['ADMIN', 'TEACHER', 'VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY']
    if (!canCreate.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, priority, category, targetRoles, targetClassId, isPinned, expiresAt } = body

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || 'MEDIUM',
        category: category || 'General',
        targetRoles: targetRoles || [],
        targetClassId: targetClassId || null,
        isPinned: isPinned || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        authorId: user.id,
        schoolId: user.schoolId
      },
      include: {
        author: { select: { id: true, name: true, role: true } }
      }
    })

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error('Announcements POST error:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
