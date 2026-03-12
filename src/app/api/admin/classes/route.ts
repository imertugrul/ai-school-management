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

    const classes = await prisma.class.findMany({
      where: {
        schoolId: user.schoolId
      },
      include: {
        school: true,
        students: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      classes
    })

  } catch (error: any) {
    console.error('Get classes error:', error)
    return NextResponse.json({ 
      error: 'Failed to get classes' 
    }, { status: 500 })
  }
}

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

    const body = await request.json()
    const { name, grade, section } = body

    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    // Check if class already exists
    const existingClass = await prisma.class.findFirst({
      where: {
        name,
        schoolId: user.schoolId
      }
    })

    if (existingClass) {
      return NextResponse.json({ 
        error: `Class "${name}" already exists!` 
      }, { status: 400 })
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        grade: grade || null,
        section: section || null,
        schoolId: user.schoolId
      }
    })

    return NextResponse.json({
      success: true,
      class: newClass
    })

  } catch (error: any) {
    console.error('Create class error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create class' 
    }, { status: 500 })
  }
}
