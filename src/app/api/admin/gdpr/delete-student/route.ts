/**
 * KVKK Madde 11 / GDPR Article 17 — Right to Erasure
 *
 * DELETE /api/admin/gdpr/delete-student
 *
 * Permanently deletes all personal data associated with a student:
 *   - Submission & Answer records
 *   - Grade records
 *   - Enrollment records
 *   - AttendanceRecord records
 *   - TeachingNote references
 *   - ParentStudent links
 *   - The User record itself
 *
 * Cascade deletes are defined in the Prisma schema, so deleting the User
 * is sufficient for most relations. Explicit pre-deletes are added for
 * relations that use SetNull or have no cascade.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, name: true, email: true },
    })

    if (admin?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId query parameter is required' }, { status: 400 })
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, email: true, name: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Target user is not a student' }, { status: 400 })
    }

    // ── Explicit deletes for relations without cascade ──
    // TeachingNote references (student is referenced as a nullable FK with SetNull — clear manually)
    await prisma.teachingNote.updateMany({
      where: { studentId },
      data: { studentId: null },
    })

    // ── Delete the user (cascade handles: Submission→Answer, Grade, Enrollment,
    //    AttendanceRecord, ParentStudent, TestAssignment, ScannedTest, EventRSVP,
    //    LibraryQuestion, SocialPost, MediaLibraryItem) ──
    await prisma.user.delete({ where: { id: studentId } })

    // ── Audit log ──
    console.log(
      `[GDPR] Student data erased by admin "${admin.email}" at ${new Date().toISOString()}. ` +
      `Deleted user ID: ${studentId}`
    )

    return NextResponse.json({
      success: true,
      message: 'All personal data for the student has been permanently deleted.',
      deletedAt: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('GDPR delete error:', error)
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 })
  }
}
