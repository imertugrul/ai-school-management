/**
 * POST /api/teacher/bulletins/[id]/send
 * Send a single READY bulletin to all eligible guardians
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { buildBulletinEmail } from '@/lib/emails/bulletinTemplate'

type Ctx = { params: { id: string } }

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true, schoolId: true },
    })
    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bulletin = await prisma.performanceBulletin.findUnique({
      where: { id: params.id },
      include: {
        student: { select: { id: true, name: true } },
        class:   { select: { id: true, name: true } },
      },
    })
    if (!bulletin || bulletin.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 })
    }
    if (bulletin.status === 'DRAFT') {
      return NextResponse.json({ error: 'Bülten henüz tamamlanmamış (DRAFT). Önce anketi doldurun.' }, { status: 400 })
    }
    if (bulletin.status === 'SENT') {
      return NextResponse.json({ error: 'Bu bülten zaten gönderildi.' }, { status: 400 })
    }

    // Fetch school name
    const school = teacher.schoolId
      ? await prisma.school.findUnique({ where: { id: teacher.schoolId }, select: { name: true } })
      : null

    // Fetch guardians with receivesEmail=true
    const guardians = await prisma.guardian.findMany({
      where: { studentId: bulletin.studentId, receivesEmail: true },
      select: { name: true, email: true },
    })

    const emailTargets = guardians.filter(g => !!g.email)
    let sentCount = 0

    const gradeDetails = bulletin.gradeDetails
      ? (bulletin.gradeDetails as { courseName: string; average: number }[])
      : null

    for (const guardian of emailTargets) {
      const { subject, html } = buildBulletinEmail({
        studentName:        bulletin.student.name,
        guardianName:       guardian.name,
        month:              bulletin.month,
        className:          bulletin.class.name,
        teacherName:        teacher.name ?? 'Öğretmen',
        attendancePresent:  bulletin.attendancePresent,
        attendanceAbsent:   bulletin.attendanceAbsent,
        attendanceLate:     bulletin.attendanceLate,
        gradeAverage:       bulletin.gradeAverage,
        gradeDetails,
        participationRating: bulletin.participationRating,
        behaviorRating:      bulletin.behaviorRating,
        homeworkRating:      bulletin.homeworkRating,
        strengthAreas:       bulletin.strengthAreas,
        improvementAreas:    bulletin.improvementAreas,
        teacherComment:      bulletin.teacherComment,
        schoolName:          school?.name,
      })

      const ok = await sendEmail({ to: guardian.email!, subject, html })
      if (ok) sentCount++
    }

    const updated = await prisma.performanceBulletin.update({
      where: { id: params.id },
      data: {
        status:     'SENT',
        sentAt:     new Date(),
        sentToCount: sentCount,
      },
    })

    return NextResponse.json({ bulletin: updated, sentToCount: sentCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
