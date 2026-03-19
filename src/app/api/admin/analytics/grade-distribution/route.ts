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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 })
    }

    const grades = await prisma.grade.findMany({
      where: {
        student: {
          schoolId: user.schoolId
        }
      },
      include: {
        component: {
          select: {
            maxScore: true,
            weight: true
          }
        }
      }
    })

    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }

    for (const grade of grades) {
      const percentage = (grade.score / grade.component.maxScore) * 100

      if (percentage >= 90) {
        distribution.A++
      } else if (percentage >= 80) {
        distribution.B++
      } else if (percentage >= 70) {
        distribution.C++
      } else if (percentage >= 60) {
        distribution.D++
      } else {
        distribution.F++
      }
    }

    return NextResponse.json({ success: true, distribution })
  } catch (error: unknown) {
    console.error('Grade distribution error:', error)
    return NextResponse.json({ error: 'Failed to get grade distribution' }, { status: 500 })
  }
}
