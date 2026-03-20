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

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month') // format: "YYYY-MM"

    let dateFilter = {}
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number)
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0, 23, 59, 59)
      dateFilter = {
        startDate: { gte: startOfMonth, lte: endOfMonth }
      }
    }

    const events = await prisma.event.findMany({
      where: {
        schoolId: user.schoolId,
        ...dateFilter
      },
      include: {
        organizer: { select: { id: true, name: true, role: true } },
        targetClass: { select: { id: true, name: true } },
        rsvps: {
          where: { userId: user.id },
          select: { status: true }
        }
      },
      orderBy: { startDate: 'asc' }
    })

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error('Events GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
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

    if (user.role !== 'ADMIN' && user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, location, startDate, endDate, isAllDay, category, color, targetRoles } = body

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        location: location || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isAllDay: isAllDay || false,
        category: category || 'General',
        color: color || null,
        targetRoles: targetRoles || [],
        organizerId: user.id,
        schoolId: user.schoolId
      },
      include: {
        organizer: { select: { id: true, name: true, role: true } }
      }
    })

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Events POST error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
