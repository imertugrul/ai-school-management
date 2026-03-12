import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// PUT - Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { name, grade, section } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: {
        name,
        grade: grade || null,
        section: section || null
      }
    })

    return NextResponse.json({ success: true, class: updatedClass })

  } catch (error: any) {
    console.error('Update class error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to update class' 
    }, { status: 500 })
  }
}

// DELETE - Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.class.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete class error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to delete class' 
    }, { status: 500 })
  }
}
