import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { status } = body

    if (!['GOING', 'MAYBE', 'NOT_GOING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid RSVP status' }, { status: 400 })
    }

    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: user.id
        }
      },
      update: { status },
      create: {
        eventId: params.id,
        userId: user.id,
        status
      }
    })

    return NextResponse.json({ success: true, rsvp })
  } catch (error) {
    console.error('RSVP POST error:', error)
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 })
  }
}
