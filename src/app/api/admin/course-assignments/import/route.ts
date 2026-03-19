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

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!admin || admin.role !== 'ADMIN' || !admin.schoolId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { rows } = await request.json()

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    const results = { success: 0, skipped: 0, errors: [] as string[] }

    for (const row of rows) {
      const { teacher_email, course_code, class_name, weekly_hours } = row

      if (!teacher_email || !course_code || !class_name) {
        results.errors.push(`Missing fields: ${JSON.stringify(row)}`)
        results.skipped++
        continue
      }

      try {
        // Find teacher
        const teacher = await prisma.user.findFirst({
          where: { email: teacher_email.trim(), role: 'TEACHER', schoolId: admin.schoolId }
        })
        if (!teacher) {
          results.errors.push(`Teacher not found: ${teacher_email}`)
          results.skipped++
          continue
        }

        // Find course
        const course = await prisma.course.findFirst({
          where: { code: course_code.trim(), schoolId: admin.schoolId }
        })
        if (!course) {
          results.errors.push(`Course not found: ${course_code}`)
          results.skipped++
          continue
        }

        // Find class
        const cls = await prisma.class.findFirst({
          where: { name: class_name.trim(), schoolId: admin.schoolId }
        })
        if (!cls) {
          results.errors.push(`Class not found: ${class_name}`)
          results.skipped++
          continue
        }

        const hours = parseInt(weekly_hours) || course.weeklyHours

        // Check duplicate
        const existing = await prisma.courseAssignment.findUnique({
          where: { courseId_teacherId_classId: { courseId: course.id, teacherId: teacher.id, classId: cls.id } }
        })

        if (existing) {
          results.skipped++
          continue
        }

        await prisma.courseAssignment.create({
          data: {
            courseId: course.id,
            teacherId: teacher.id,
            classId: cls.id,
            weeklyHours: hours
          }
        })

        results.success++
      } catch (err: any) {
        results.errors.push(`Row error: ${err.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({ success: true, results })

  } catch (error: any) {
    console.error('Import assignments error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
