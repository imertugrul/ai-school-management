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

    const { isActive } = await request.json()

    await prisma.test.update({
      where: { id: params.id },
      data: { isActive }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Toggle status error:', error)
    return NextResponse.json({ error: 'Failed to toggle status' }, { status: 500 })
  }
}
