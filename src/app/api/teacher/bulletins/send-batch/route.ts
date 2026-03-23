/**
 * POST /api/teacher/bulletins/send-batch
 * { month, classId } — send all READY bulletins for this class+month
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { buildBulletinEmail } from '@/lib/emails/bulletinTemplate'

export async function POST(request: NextRequest) {
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

    const { month, classId } = await request.json()
    if (!month || !classId) {
      return NextResponse.json({ error: 'month and classId required' }, { status: 400 })
    }

    const school = teacher.schoolId
      ? await prisma.school.findUnique({ where: { id: teacher.schoolId }, select: { name: true } })
      : null

    const bulletins = await prisma.performanceBulletin.findMany({
      where: { teacherId: teacher.id, classId, month, status: 'READY' },
      include: {
        student: { select: { id: true, name: true } },
        class:   { select: { id: true, name: true } },
      },
    })

    if (bulletins.length === 0) {
      return NextResponse.json({ message: 'Gönderilecek hazır bülten bulunamadı.', sent: 0, failed: 0 })
    }

    let sent = 0
    let failed = 0
    const results: { studentName: string; sentCount: number }[] = []

    for (const bulletin of bulletins) {
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

      await prisma.performanceBulletin.update({
        where: { id: bulletin.id },
        data: {
          status:      'SENT',
          sentAt:      new Date(),
          sentToCount: sentCount,
        },
      })

      results.push({ studentName: bulletin.student.name, sentCount })
      if (sentCount > 0 || emailTargets.length === 0) sent++
      else failed++
    }

    return NextResponse.json({ sent, failed, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
