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

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: user.id },
      include: {
        class: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    })

    const total = records.length
    const present = records.filter(r => r.status === 'PRESENT').length
    const absent  = records.filter(r => r.status === 'ABSENT').length
    const late    = records.filter(r => r.status === 'LATE').length
    const excused = records.filter(r => r.status === 'EXCUSED').length
    const rate    = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0

    return NextResponse.json({
      success: true,
      records,
      stats: { total, present, absent, late, excused, rate }
    })

  } catch (error: any) {
    console.error('Get student attendance error:', error)
    return NextResponse.json({ error: 'Failed to get attendance' }, { status: 500 })
  }
}
