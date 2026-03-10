import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false,
        error: 'Please login first' 
      }, { status: 401 })
    }

    const { testId } = await request.json()

    // Get student
    const student = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!student) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 404 })
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json({ 
        success: false,
        error: 'Only students can join tests' 
      }, { status: 403 })
    }

    // Check if already assigned
    const existing = await prisma.testAssignment.findUnique({
      where: {
        testId_studentId: {
          testId,
          studentId: student.id
        }
      }
    })

    if (!existing) {
      // Auto-assign
      await prisma.testAssignment.create({
        data: {
          testId,
          studentId: student.id,
          assignedBy: student.id // Self-assigned via code
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Auto-assign error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to join test' 
    }, { status: 500 })
  }
}
