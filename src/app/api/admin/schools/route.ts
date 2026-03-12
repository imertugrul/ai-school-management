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

    const { name } = await request.json()

    const school = await prisma.school.create({
      data: {
        name: name || 'My School'
      }
    })

    // Assign school to admin
    await prisma.user.update({
      where: { id: user.id },
      data: { schoolId: school.id }
    })

    return NextResponse.json({ success: true, school })

  } catch (error: any) {
    console.error('Create school error:', error)
    return NextResponse.json({ 
      error: 'Failed to create school' 
    }, { status: 500 })
  }
}
