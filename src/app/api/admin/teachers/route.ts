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

    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        schoolId: user.schoolId
      },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      teachers
    })

  } catch (error: any) {
    console.error('Get teachers error:', error)
    return NextResponse.json({ 
      error: 'Failed to get teachers' 
    }, { status: 500 })
  }
}
