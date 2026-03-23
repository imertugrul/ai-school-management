/**
 * KVKK Madde 7 & 11 / GDPR Article 17 — Right to Erasure
 *
 * DELETE /api/admin/gdpr/delete-student?studentId=xxx
 *
 * Steps:
 *  1. Snapshot student + parent data (before deletion)
 *  2. Null-out SetNull FK references (TeachingNote.studentId)
 *  3. Delete User — cascades to all related tables
 *  4. Write GdprLog entry
 *  5. Email parent (or school admin) with deletion confirmation
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendEmail, buildGdprDeletionEmail } from '@/lib/email'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { role: true, name: true, email: true, school: { select: { name: true } } },
    })

    if (admin?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId query parameter is required' }, { status: 400 })
    }

    // ── Step 1: Snapshot student + parent info before deletion ──
    const student = await prisma.user.findUnique({
      where:   { id: studentId },
      select: {
        id:    true,
        role:  true,
        name:  true,
        email: true,
        parentLinks: {
          include: { parent: { select: { name: true, email: true } } },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Target user is not a student' }, { status: 400 })
    }

    const studentName  = student.name
    const studentEmail = student.email
    const parents      = student.parentLinks.map(pl => pl.parent)
    const deletedAt    = new Date()

    // ── Step 2: Clear SetNull FK references ──
    await prisma.teachingNote.updateMany({
      where: { studentId },
      data:  { studentId: null },
    })

    // ── Step 3: Delete user (cascade handles everything else) ──
    await prisma.user.delete({ where: { id: studentId } })

    // ── Step 4: Determine email recipient ──
    const emailRecipient = parents[0] ?? null
    const recipientEmail = emailRecipient?.email ?? admin.email!
    const recipientName  = emailRecipient?.name  ?? admin.name ?? 'School Admin'
    const schoolName     = admin.school?.name    ?? 'School'
    const schoolEmail    = admin.email!

    // ── Step 5: Write GdprLog ──
    const gdprLog = await prisma.gdprLog.create({
      data: {
        studentName,
        studentEmail,
        deletedBy:     admin.email!,
        parentEmailed: false, // will update below
        parentEmail:   emailRecipient?.email ?? null,
      },
    })

    // ── Step 6: Send email ──
    const emailHtml = buildGdprDeletionEmail({
      parentName:  recipientName,
      studentName,
      deletedAt:   deletedAt.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
      adminName:   admin.name ?? admin.email!,
      schoolName,
      schoolEmail,
    })

    const emailSent = await sendEmail({
      to:      recipientEmail,
      subject: `Veri Silme Talebi Tamamlandı | KVKK Madde 7 — ${studentName}`,
      html:    emailHtml,
    })

    // Update log with email result
    await prisma.gdprLog.update({
      where: { id: gdprLog.id },
      data:  { parentEmailed: emailSent },
    })

    return NextResponse.json({
      success:       true,
      studentName,
      deletedAt:     deletedAt.toISOString(),
      parentEmailed: emailSent,
      parentFound:   !!emailRecipient,
    })

  } catch (error: any) {
    console.error('GDPR delete error:', error)
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 })
  }
}
