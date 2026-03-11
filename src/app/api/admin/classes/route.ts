import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// GET - Tüm sınıfları listele
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: [
        { grade: 'asc' },
        { section: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      classes
    })
  } catch (error) {
    console.error('Get classes error:', error)
    return NextResponse.json({ error: 'Failed to get classes' }, { status: 500 })
  }
}

// POST - Yeni sınıf oluştur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { grade, section } = await request.json()

    if (!grade || !section) {
      return NextResponse.json({ error: 'Grade and section required' }, { status: 400 })
    }

    const name = `${grade}-${section}`

    // Check if already exists
    const existing = await prisma.class.findFirst({
      where: { name }
    })

    if (existing) {
      return NextResponse.json({ error: 'Class already exists' }, { status: 400 })
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        grade: grade,
        section,
      }
    })

    return NextResponse.json({
      success: true,
      class: newClass
    })
  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}
