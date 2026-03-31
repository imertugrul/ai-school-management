/**
 * GET  /api/admin/students/[id]/guardians  — List guardians for a student
 * POST /api/admin/students/[id]/guardians  — Add a guardian
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { role: true },
    })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const guardians = await prisma.guardian.findMany({
      where:   { studentId: params.id },
      include: { user: { select: { id: true, email: true } } },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ guardians })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { role: true, schoolId: true },
    })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: params.id, role: 'STUDENT' },
      select: { id: true },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const {
      name, relationship, email, phone,
      isPrimary, receivesEmail, receivesSMS,
      note, givePortalAccess,
    } = await request.json()

    if (!name || !relationship) {
      return NextResponse.json({ error: 'Ad ve ilişki zorunludur' }, { status: 400 })
    }

    // If isPrimary, unset all others first
    if (isPrimary) {
      await prisma.guardian.updateMany({
        where: { studentId: params.id },
        data:  { isPrimary: false },
      })
    }

    // Handle portal access
    let userId: string | null = null
    let tempPassword: string | null = null

    if (givePortalAccess && email) {
      let parentUser = await prisma.user.findUnique({ where: { email } })

      if (!parentUser) {
        tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
        parentUser = await prisma.user.create({
          data: {
            email,
            name,
            password: await hashPassword(tempPassword),
            role:     'PARENT',
            status:   'ACTIVE',
            schoolId: admin.schoolId ?? undefined,
          },
        })
      } else if (parentUser.role !== 'PARENT') {
        await prisma.user.update({
          where: { id: parentUser.id },
          data:  { role: 'PARENT', schoolId: admin.schoolId ?? undefined },
        })
      }

      userId = parentUser.id

      // Maintain backward-compat ParentStudent link
      await prisma.parentStudent.upsert({
        where:  { parentId_studentId: { parentId: parentUser.id, studentId: params.id } },
        update: { relationship },
        create: { parentId: parentUser.id, studentId: params.id, relationship },
      })
    }

    const guardian = await prisma.guardian.create({
      data: {
        studentId:    params.id,
        name,
        relationship,
        email:        email || null,
        phone:        phone || null,
        isPrimary:    !!isPrimary,
        receivesEmail: receivesEmail !== false,
        receivesSMS:  !!receivesSMS,
        note:         note || null,
        userId,
      },
      include: { user: { select: { id: true, email: true } } },
    })

    return NextResponse.json({ guardian, tempPassword })
  } catch (error: any) {
    console.error('POST guardians error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
