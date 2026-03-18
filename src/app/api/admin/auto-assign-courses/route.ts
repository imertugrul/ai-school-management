import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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

    // Get all courses
    const courses = await prisma.course.findMany({
      where: { schoolId: user.schoolId }
    })

    // Get all teachers with subjects
    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        schoolId: user.schoolId,
        subject: { not: null }
      }
    })

    // Get all classes
    const classes = await prisma.class.findMany({
      where: { schoolId: user.schoolId }
    })

    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Auto-assign logic: Match course name with teacher subject AND grade
    for (const course of courses) {
      for (const cls of classes) {
        // GRADE MATCHING: Skip if course grade doesn't match class grade
        if (course.grade && cls.grade && course.grade !== cls.grade) {
          results.skipped++
          continue
        }
        
        // Find matching teacher
        const matchingTeacher = teachers.find(t => 
          course.name.toLowerCase().includes(t.subject?.toLowerCase() || '')
        )

        if (!matchingTeacher) {
          results.skipped++
          results.errors.push(`No matching teacher for ${course.code} (${cls.name})`)
          continue
        }

        // Check if assignment already exists
        const existing = await prisma.courseAssignment.findUnique({
          where: {
            courseId_teacherId_classId: {
              courseId: course.id,
              teacherId: matchingTeacher.id,
              classId: cls.id
            }
          }
        })

        if (existing) {
          results.skipped++
          continue
        }

        // Create assignment
        try {
          await prisma.courseAssignment.create({
            data: {
              courseId: course.id,
              teacherId: matchingTeacher.id,
              classId: cls.id,
              weeklyHours: course.weeklyHours
            }
          })
          results.success++
        } catch (error: any) {
          results.errors.push(`Failed to assign ${course.code} to ${matchingTeacher.name}: ${error.message}`)
        }
      }
    }

    return NextResponse.json({ success: true, results })

  } catch (error: any) {
    console.error('Auto-assign error:', error)
    return NextResponse.json({ 
      error: 'Failed to auto-assign courses' 
    }, { status: 500 })
  }
}