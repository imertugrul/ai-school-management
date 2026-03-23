/**
 * PUT    /api/admin/students/[id]/guardians/[guardianId]  — Update guardian
 * DELETE /api/admin/students/[id]/guardians/[guardianId]  — Delete guardian
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

type Ctx = { params: { id: string; guardianId: string } }

async function requireAdmin(email: string) {
  const admin = await prisma.user.findUnique({
    where:  { email },
    select: { role: true, schoolId: true },
  })
  return admin?.role === 'ADMIN' ? admin : null
}

// ─── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await requireAdmin(session.user.email)
    if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const existing = await prisma.guardian.findUnique({
      where: { id: params.guardianId },
    })
    if (!existing || existing.studentId !== params.id) {
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
    }

    const {
      name, relationship, email, phone,
      isPrimary, receivesEmail, receivesSMS, note,
    } = await request.json()

    // If setting isPrimary, clear others
    if (isPrimary && !existing.isPrimary) {
      await prisma.guardian.updateMany({
        where: { studentId: params.id, id: { not: params.guardianId } },
        data:  { isPrimary: false },
      })
    }

    const guardian = await prisma.guardian.update({
      where: { id: params.guardianId },
      data: {
        name:          name         ?? existing.name,
        relationship:  relationship ?? existing.relationship,
        email:         email        !== undefined ? (email || null) : existing.email,
        phone:         phone        !== undefined ? (phone || null) : existing.phone,
        isPrimary:     isPrimary    !== undefined ? !!isPrimary    : existing.isPrimary,
        receivesEmail: receivesEmail !== undefined ? !!receivesEmail : existing.receivesEmail,
        receivesSMS:   receivesSMS  !== undefined ? !!receivesSMS  : existing.receivesSMS,
        note:          note         !== undefined ? (note || null) : existing.note,
      },
      include: { user: { select: { id: true, email: true } } },
    })

    return NextResponse.json({ guardian })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await requireAdmin(session.user.email)
    if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    // Prevent deleting the last guardian
    const count = await prisma.guardian.count({ where: { studentId: params.id } })
    if (count <= 1) {
      return NextResponse.json(
        { error: 'En az bir veli kaydı bulunmalıdır. Silme işlemi iptal edildi.' },
        { status: 400 }
      )
    }

    const existing = await prisma.guardian.findUnique({
      where: { id: params.guardianId },
      select: { userId: true, studentId: true },
    })
    if (!existing || existing.studentId !== params.id) {
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
    }

    await prisma.guardian.delete({ where: { id: params.guardianId } })

    // If there was a portal link and it was the only guardian with this userId, remove ParentStudent too
    if (existing.userId) {
      const remaining = await prisma.guardian.count({
        where: { studentId: params.id, userId: existing.userId },
      })
      if (remaining === 0) {
        await prisma.parentStudent.deleteMany({
          where: { parentId: existing.userId, studentId: params.id },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
