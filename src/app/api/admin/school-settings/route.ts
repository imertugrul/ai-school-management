import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Get school settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { school: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      settings: {
        schoolStartTime: user.school.schoolStartTime,
        schoolEndTime: user.school.schoolEndTime,
        lessonDuration: user.school.lessonDuration,
        breakDuration: user.school.breakDuration,
        lunchBreakStart: user.school.lunchBreakStart,
        lunchBreakEnd: user.school.lunchBreakEnd
      }
    })

  } catch (error: any) {
    console.error('Get school settings error:', error)
    return NextResponse.json({ 
      error: 'Failed to get settings' 
    }, { status: 500 })
  }
}

// PUT - Update school settings
export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const { 
      schoolStartTime, 
      schoolEndTime, 
      lessonDuration, 
      breakDuration,
      lunchBreakStart,
      lunchBreakEnd
    } = await request.json()

    const school = await prisma.school.update({
      where: { id: user.schoolId },
      data: {
        schoolStartTime,
        schoolEndTime,
        lessonDuration: parseInt(lessonDuration),
        breakDuration: parseInt(breakDuration),
        lunchBreakStart,
        lunchBreakEnd
      }
    })

    return NextResponse.json({ success: true, school })

  } catch (error: any) {
    console.error('Update school settings error:', error)
    return NextResponse.json({ 
      error: 'Failed to update settings' 
    }, { status: 500 })
  }
}
