import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!parent || parent.role !== 'PARENT') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 })
    }

    // Verify parent-student link
    const link = await prisma.parentStudent.findFirst({
      where: { parentId: parent.id, studentId: params.studentId }
    })

    if (!link) {
      return NextResponse.json({ error: 'Not authorized to view this student' }, { status: 403 })
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: params.studentId },
      include: {
        class: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    })

    const total = records.length
    const present = records.filter(r => r.status === 'PRESENT').length
    const absent = records.filter(r => r.status === 'ABSENT').length
    const late = records.filter(r => r.status === 'LATE').length
    const excused = records.filter(r => r.status === 'EXCUSED').length
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    return NextResponse.json({
      success: true,
      summary: { total, present, absent, late, excused, attendanceRate },
      records
    })
  } catch (error) {
    console.error('Parent child attendance GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}
