import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, schoolId: true },
    })
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const docs = await prisma.schoolDocument.findMany({
      where: {
        isActive: true,
        ...(user.schoolId ? { OR: [{ schoolId: user.schoolId }, { schoolId: null }] } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, description: true, fileUrl: true,
        fileType: true, category: true, createdAt: true, isActive: true,
        uploader: { select: { name: true } },
      },
    })

    return NextResponse.json(docs)
  } catch (err) {
    console.error('GET /api/documents error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
