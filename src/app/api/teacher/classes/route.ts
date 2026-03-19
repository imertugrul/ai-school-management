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

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const assignments = await prisma.courseAssignment.findMany({
      where: { teacherId: user.id },
      include: {
        class: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        }
      },
      distinct: ['classId']
    })

    const classes = assignments.map(a => a.class)

    return NextResponse.json({ success: true, classes })

  } catch (error: any) {
    console.error('Get teacher classes error:', error)
    return NextResponse.json({ error: 'Failed to get classes' }, { status: 500 })
  }
}
