import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
    }

    // Get teacher user
    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get all students in this class
    const students = await prisma.user.findMany({
      where: {
        classId: classId,
        role: 'STUDENT'
      }
    })

    if (students.length === 0) {
      return NextResponse.json({ 
        error: 'No students found in this class' 
      }, { status: 400 })
    }

    // Assign test to all students
    let assignedCount = 0

    for (const student of students) {
      // Check if already assigned
      const existing = await prisma.testAssignment.findUnique({
        where: {
          testId_studentId: {
            testId: params.id,
            studentId: student.id
          }
        }
      })

      if (!existing) {
        await prisma.testAssignment.create({
          data: {
            testId: params.id,
            studentId: student.id,
            assignedBy: teacher.id
          }
        })
        assignedCount++
      }
    }

    // Update test status to ASSIGNED if still DRAFT
    await prisma.test.update({
      where: { id: params.id },
      data: { status: assignedCount > 0 ? 'ASSIGNED' : undefined }
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      assignedCount,
      totalStudents: students.length
    })

  } catch (error: any) {
    console.error('Assign class error:', error)
    return NextResponse.json({ 
      error: 'Failed to assign test to class' 
    }, { status: 500 })
  }
}
