import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { classId } = await request.json()

    await prisma.user.update({
      where: { id: params.id },
      data: { classId: classId || null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Assign class error:', error)
    return NextResponse.json({ error: 'Failed to assign class' }, { status: 500 })
  }
}
