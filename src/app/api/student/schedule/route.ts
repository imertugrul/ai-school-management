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
      where: { email: session.user.email! },
      include: {
        studentEnrollments: {
          include: {
            course: {
              include: {
                schedules: {
                  include: {
                    teacher: {
                      select: { name: true }
                    },
                    class: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    // Collect all schedules from enrolled courses
    const schedules = user.studentEnrollments.flatMap(enrollment => 
      enrollment.course.schedules
    )

    return NextResponse.json({ success: true, schedules })

  } catch (error: any) {
    console.error('Get student schedule error:', error)
    return NextResponse.json({ 
      error: 'Failed to get schedule' 
    }, { status: 500 })
  }
}
