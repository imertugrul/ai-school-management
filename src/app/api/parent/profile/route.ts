import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!user || user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get first Guardian record linked to this user for notification prefs
    const guardian = await prisma.guardian.findFirst({
      where: { userId: user.id },
      select: { phone: true, receivesEmail: true, receivesSMS: true, relationship: true },
    })

    return NextResponse.json({
      profile: {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        phone:         guardian?.phone ?? '',
        relationship:  guardian?.relationship ?? '',
        receivesEmail: guardian?.receivesEmail ?? true,
        receivesSMS:   guardian?.receivesSMS ?? false,
      },
    })
  } catch (error) {
    console.error('parent profile GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!user || user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, phone, receivesEmail, receivesSMS } = await request.json()

    // Update User name
    if (name) {
      await prisma.user.update({ where: { id: user.id }, data: { name } })
    }

    // Update all Guardian records for this user
    await prisma.guardian.updateMany({
      where: { userId: user.id },
      data: {
        ...(name   !== undefined && { name }),
        ...(phone  !== undefined && { phone }),
        ...(receivesEmail !== undefined && { receivesEmail }),
        ...(receivesSMS   !== undefined && { receivesSMS }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('parent profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
