import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!user || !['PARENT', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Via Guardian.userId
    const guardianLinks = await prisma.guardian.findMany({
      where: { userId: user.id },
      include: {
        student: { select: { id: true, name: true, classId: true, class: { select: { id: true, name: true } } } },
      },
    })

    // Via ParentStudent.parentId (legacy)
    const parentLinks = await prisma.parentStudent.findMany({
      where: { parentId: user.id },
      include: {
        student: { select: { id: true, name: true, classId: true, class: { select: { id: true, name: true } } } },
      },
    })

    // Merge + dedup
    const seen = new Set<string>()
    const children: { id: string; name: string; className: string; classId: string | null }[] = []

    for (const g of guardianLinks) {
      if (!seen.has(g.student.id)) {
        seen.add(g.student.id)
        children.push({
          id: g.student.id,
          name: g.student.name,
          className: g.student.class?.name ?? '',
          classId: g.student.classId,
        })
      }
    }
    for (const p of parentLinks) {
      if (!seen.has(p.student.id)) {
        seen.add(p.student.id)
        children.push({
          id: p.student.id,
          name: p.student.name,
          className: p.student.class?.name ?? '',
          classId: p.student.classId,
        })
      }
    }

    return NextResponse.json({ children })
  } catch (error) {
    console.error('parent/children GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
  }
}
