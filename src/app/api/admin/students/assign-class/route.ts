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

    const { studentId, classId } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    // Update student's class
    await prisma.user.update({
      where: { id: studentId },
      data: {
        classId: classId || null
      }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Assign class error:', error)
    return NextResponse.json({ 
      error: 'Failed to assign class' 
    }, { status: 500 })
  }
}
