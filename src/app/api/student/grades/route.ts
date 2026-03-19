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

    if (!user.classId) {
      return NextResponse.json({ 
        success: true, 
        courses: [],
        overallGPA: null 
      })
    }

    // Get student's schedules to find their courses
    const schedules = await prisma.schedule.findMany({
      where: {
        classId: user.classId
      },
      include: {
        course: {
          include: {
            gradeComponents: {
              include: {
                grades: {
                  where: {
                    studentId: user.id
                  }
                }
              }
            }
          }
        }
      }
    })

    // Group by unique courses
    const coursesMap = new Map()

    schedules.forEach(schedule => {
      if (!coursesMap.has(schedule.courseId)) {
        coursesMap.set(schedule.courseId, schedule.course)
      }
    })

    const courses = Array.from(coursesMap.values())

    // Calculate grades for each course
    const courseGrades = courses.map(course => {
      const components = course.gradeComponents.map((component: any) => ({
        id: component.id,
        name: component.name,
        type: component.type,
        weight: component.weight,
        maxScore: component.maxScore,
        grade: component.grades[0] || null
      }))

      // Calculate weighted average
      let totalWeighted = 0
      let totalWeight = 0

      components.forEach(component => {
        if (component.grade && component.grade.score !== null) {
          const percentage = (component.grade.score / component.maxScore) * 100
          totalWeighted += percentage * component.weight
          totalWeight += component.weight
        }
      })

      const average = totalWeight > 0 ? totalWeighted / totalWeight : null

      return {
        course: {
          id: course.id,
          code: course.code,
          name: course.name
        },
        components,
        average,
        totalWeight
      }
    })

    // Calculate overall GPA (average of all course averages)
    const courseAverages = courseGrades
      .map(c => c.average)
      .filter(avg => avg !== null) as number[]

    const overallGPA = courseAverages.length > 0
      ? courseAverages.reduce((sum, avg) => sum + avg, 0) / courseAverages.length
      : null

    return NextResponse.json({ 
      success: true, 
      courses: courseGrades,
      overallGPA
    })

  } catch (error: any) {
    console.error('Get student grades error:', error)
    return NextResponse.json({ 
      error: 'Failed to get grades' 
    }, { status: 500 })
  }
}
