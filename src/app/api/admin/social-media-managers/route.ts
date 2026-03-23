import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const managers = await prisma.user.findMany({
      where:   { role: 'SOCIAL_MEDIA_MANAGER' },
      select:  {
        id: true, name: true, email: true, department: true, createdAt: true,
        _count: { select: { socialPosts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, managers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, email, password, department } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const hashed = await hashPassword(password)

    const manager = await prisma.user.create({
      data: {
        name,
        email,
        password:   hashed,
        role:       'SOCIAL_MEDIA_MANAGER',
        department: department || null,
        schoolId:   admin.schoolId ?? null,
      },
      select: {
        id: true, name: true, email: true, department: true, createdAt: true,
        _count: { select: { socialPosts: true } },
      },
    })

    return NextResponse.json({ success: true, manager })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
