/**
 * Absence notification delivery service.
 * Sends email (Resend) + WhatsApp (Twilio) to guardians.
 */
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// ─── WhatsApp via Twilio ──────────────────────────────────────────────────────
async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

  if (!sid || !token) {
    return { ok: false, error: 'Twilio credentials not configured' }
  }

  try {
    const twilio = require('twilio')(sid, token)
    await twilio.messages.create({
      from,
      to: `whatsapp:${to.startsWith('+') ? to : '+' + to}`,
      body,
    })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Twilio error' }
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function statusLabel(status: string): string {
  return status === 'ABSENT' ? 'DEVAMSIZ' : 'GEÇ'
}

// ─── Email HTML ───────────────────────────────────────────────────────────────
function buildAbsenceEmailHtml(opts: {
  guardianName: string
  studentName:  string
  className:    string
  date:         Date
  status:       string
  schoolName:   string
  schoolPhone?: string
  schoolEmail?: string
}): { subject: string; html: string } {
  const dateStr  = formatDate(opts.date)
  const label    = statusLabel(opts.status)
  const badgeColor = opts.status === 'ABSENT' ? '#dc2626' : '#d97706'

  const subject = `Devamsızlık Bildirimi — ${opts.studentName} | ${opts.date.toLocaleDateString('tr-TR')}`

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08);">
        <tr>
          <td style="background:${badgeColor};padding:28px 36px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,.8);letter-spacing:1px;text-transform:uppercase;">${opts.schoolName}</p>
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">Devamsızlık Bildirimi</h1>
          </td>
        </tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">Sayın <strong>${opts.guardianName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
            <strong>${opts.studentName}</strong> adlı öğrencimiz aşağıda belirtilen tarihte
            <span style="display:inline-block;background:${badgeColor};color:#fff;font-weight:700;padding:2px 10px;border-radius:20px;font-size:13px;">${label}</span>
            olarak işaretlenmiştir.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:24px;">
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;font-size:14px;">
                <span style="color:#6b7280;">Öğrenci:</span>
                <strong style="margin-left:8px;">${opts.studentName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;font-size:14px;">
                <span style="color:#6b7280;">Sınıf:</span>
                <strong style="margin-left:8px;">${opts.className}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;font-size:14px;">
                <span style="color:#6b7280;">Tarih:</span>
                <strong style="margin-left:8px;">${dateStr}</strong>
              </td>
            </tr>
          </table>
          <p style="font-size:14px;color:#374151;line-height:1.7;">
            Bu durum ile ilgili bilgi almak için lütfen okul ile iletişime geçin.
          </p>
          ${opts.schoolPhone ? `<p style="font-size:14px;color:#374151;">📞 ${opts.schoolPhone}</p>` : ''}
          ${opts.schoolEmail ? `<p style="font-size:14px;color:#374151;">📧 ${opts.schoolEmail}</p>` : ''}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
          <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">${opts.schoolName} · Bu e-posta otomatik olarak oluşturulmuştur.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}

// ─── WhatsApp message ─────────────────────────────────────────────────────────
function buildWhatsAppMessage(opts: {
  guardianName: string
  studentName:  string
  className:    string
  date:         Date
  status:       string
  schoolName:   string
  schoolPhone?: string
}): string {
  const label   = statusLabel(opts.status)
  const dateStr = formatDate(opts.date)
  return `🏫 ${opts.schoolName}

Sayın ${opts.guardianName},

${opts.studentName} bugün ${label} olarak işaretlenmiştir.

📅 Tarih: ${dateStr}
🏫 Sınıf: ${opts.className}

Bilgi için lütfen okul ile iletişime geçin.${opts.schoolPhone ? '\n📞 ' + opts.schoolPhone : ''}`
}

// ─── Main send function ───────────────────────────────────────────────────────
export async function sendAbsenceNotification(notificationId: string): Promise<void> {
  const notif = await prisma.absenceNotification.findUnique({
    where: { id: notificationId },
    include: {
      student: { select: { name: true } },
      class:   { select: { name: true } },
      attendance: { select: { status: true } },
    },
  })
  if (!notif) throw new Error('AbsenceNotification not found')

  // Fetch school info
  const student = await prisma.user.findUnique({
    where: { id: notif.studentId },
    select: { schoolId: true },
  })
  const school = student?.schoolId
    ? await prisma.school.findUnique({
        where: { id: student.schoolId },
        select: { name: true },
      })
    : null

  // Fetch guardians
  const guardians = await prisma.guardian.findMany({
    where: { studentId: notif.studentId },
    select: { name: true, email: true, phone: true, receivesEmail: true, receivesSMS: true },
  })

  const schoolName  = school?.name ?? 'Okul'
  const status      = notif.attendance.status as string
  const emailOpts   = {
    guardianName: '',
    studentName:  notif.student.name,
    className:    notif.class.name,
    date:         notif.date,
    status,
    schoolName,
  }
  const whatsappOpts = { ...emailOpts }

  let emailSent   = false
  let whatsappSent = false
  let emailError: string | undefined
  let whatsappError: string | undefined

  for (const guardian of guardians) {
    // Email
    if (guardian.receivesEmail && guardian.email) {
      const { subject, html } = buildAbsenceEmailHtml({ ...emailOpts, guardianName: guardian.name })
      const ok = await sendEmail({ to: guardian.email, subject, html })
      if (ok) emailSent = true
      else emailError = 'Email delivery failed'
    }
    // WhatsApp
    if (guardian.receivesSMS && guardian.phone) {
      const body = buildWhatsAppMessage({ ...whatsappOpts, guardianName: guardian.name })
      const result = await sendWhatsApp(guardian.phone, body)
      if (result.ok) whatsappSent = true
      else whatsappError = result.error
    }
  }

  const allFailed = !emailSent && !whatsappSent && guardians.length > 0
  const newStatus = allFailed ? 'FAILED' : 'SENT'

  await prisma.absenceNotification.update({
    where: { id: notificationId },
    data: {
      status: newStatus,
      sentAt: newStatus === 'SENT' ? new Date() : undefined,
      emailSent,
      whatsappSent,
      emailError:    emailError    ?? null,
      whatsappError: whatsappError ?? null,
    },
  })
}
