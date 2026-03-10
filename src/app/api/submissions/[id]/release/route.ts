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

    // Update submission to RELEASED
    await prisma.submission.update({
      where: { id: params.id },
      data: {
        status: 'RELEASED'
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Results released to student!'
    })

  } catch (error: any) {
    console.error('Release error:', error)
    return NextResponse.json({ 
      error: 'Failed to release results' 
    }, { status: 500 })
  }
}
