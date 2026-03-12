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

    const { teacherId, subject } = await request.json()

    await prisma.user.update({
      where: { id: teacherId },
      data: { subject: subject || null }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update subject error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to update subject' 
    }, { status: 500 })
  }
}
