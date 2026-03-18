import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const components = await prisma.gradeComponent.findMany({
      where: {
        courseId: params.courseId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ success: true, components })

  } catch (error: any) {
    console.error('Get components error:', error)
    return NextResponse.json({ 
      error: 'Failed to get components' 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { name, type, weight, maxScore, date } = await request.json()

    const component = await prisma.gradeComponent.create({
      data: {
        courseId: params.courseId,
        name,
        type,
        weight,
        maxScore,
        date: date ? new Date(date) : null
      }
    })

    return NextResponse.json({ success: true, component })

  } catch (error: any) {
    console.error('Create component error:', error)
    return NextResponse.json({ 
      error: 'Failed to create component' 
    }, { status: 500 })
  }
}
