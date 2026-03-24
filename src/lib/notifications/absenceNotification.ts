/**
 * Absence notification delivery service
 * Sends WhatsApp (Twilio) and Email (Resend) to student guardians
 */
import { prisma } from '@/lib/prisma'

// Convert Turkish phone numbers to E.164 format
function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `+90${digits.slice(1)}`
  if (digits.length === 10) return `+90${digits}`
  if (digits.startsWith('9') && digits.length === 12) return `+${digits}`
  return null
}

async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sid   = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from  = process.env.TWILIO_WHATSAPP_FROM
    if (!sid || !token || !from) return { ok: false, error: 'Twilio credentials not configured' }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const client = require('twilio')(sid, token)
    const e164 = toE164(to)
    if (!e164) return { ok: false, error: `Invalid phone number: ${to}` }

    await client.messages.create({
      from: `whatsapp:${from}`,
      to:   `whatsapp:${e164}`,
      body,
    })
    return { ok: true }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function buildWhatsAppMessage(opts: {
  studentName: string
  className: string
  attendanceStatus: string
  date: Date
  schoolName: string
  schoolPhone: string
}): string {
  const dateStr     = opts.date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  const statusLabel = opts.attendanceStatus === 'ABSENT' ? 'devamsız' : 'geç gelmiş'
  return [
    `📢 *${opts.schoolName} — Devamsızlık Bildirimi*`,
    ``,
    `Sayın Veli,`,
    ``,
    `*${opts.studentName}* adlı öğrencinin ${dateStr} tarihinde *${statusLabel}* olduğu belirlenmiştir.`,
    ``,
    `Bilgi ve gereği için,`,
    `📞 ${opts.schoolPhone}`,
    `_${opts.schoolName}_`,
  ].join('\n')
}

function buildAbsenceEmailHtml(opts: {
  studentName: string
  className: string
  attendanceStatus: string
  date: Date
  schoolName: string
  schoolEmail: string
  schoolPhone: string
}): { subject: string; html: string } {
  const dateStr     = opts.date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  const statusLabel = opts.attendanceStatus === 'ABSENT' ? 'Devamsız' : 'Geç Kaldı'
  const subject     = `Devamsızlık Bildirimi — ${opts.studentName} — ${dateStr}`

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
        <tr><td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px 40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">📢 Devamsızlık Bildirimi</h1>
          <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px">${opts.schoolName}</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="color:#374151;font-size:15px;margin:0 0 24px">Sayın Veli,</p>
          <table width="100%" cellpadding="12" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px">
            <tr>
              <td style="color:#6b7280;font-size:13px;width:40%">Öğrenci</td>
              <td style="color:#111827;font-size:14px;font-weight:600">${opts.studentName}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:13px">Sınıf</td>
              <td style="color:#111827;font-size:14px">${opts.className}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:13px">Tarih</td>
              <td style="color:#111827;font-size:14px">${dateStr}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:13px">Durum</td>
              <td style="color:#dc2626;font-size:14px;font-weight:600">${statusLabel}</td>
            </tr>
          </table>
          <p style="color:#374151;font-size:14px;line-height:1.6">Herhangi bir sorunuz için lütfen okulumuzla iletişime geçiniz.</p>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">
            📞 ${opts.schoolPhone}<br>
            ✉️ ${opts.schoolEmail}
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="color:#9ca3af;font-size:12px;margin:0">${opts.schoolName} — Otomatik Bildirim Sistemi</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}

export async function sendAbsenceNotification(notificationId: string): Promise<{
  whatsappSent: boolean
  emailSent: boolean
  whatsappError?: string
  emailError?: string
}> {
  const notif = await prisma.absenceNotification.findUnique({
    where: { id: notificationId },
    include: {
      student:  { select: { id: true, name: true } },
      class:    { select: { name: true } },
      attendance: { select: { status: true } },
    },
  })

  if (!notif) throw new Error(`AbsenceNotification ${notificationId} not found`)

  const guardians = await prisma.guardian.findMany({
    where: { studentId: notif.studentId },
  })

  const schoolName  = process.env.SCHOOL_NAME  || 'Okul'
  const schoolPhone = process.env.SCHOOL_PHONE  || ''
  const schoolEmail = process.env.SCHOOL_EMAIL  || ''

  // No guardians — mark FAILED
  if (guardians.length === 0) {
    await prisma.absenceNotification.update({
      where: { id: notificationId },
      data: {
        status:        'FAILED',
        emailError:    'Kayıtlı veli bulunamadı',
        whatsappError: 'Kayıtlı veli bulunamadı',
        sentAt:        new Date(),
      },
    })
    return { whatsappSent: false, emailSent: false, whatsappError: 'No guardian', emailError: 'No guardian' }
  }

  const msgOpts = {
    studentName:      notif.student.name || 'Öğrenci',
    className:        notif.class.name,
    attendanceStatus: notif.attendance.status,
    date:             notif.date,
    schoolName,
    schoolPhone,
  }

  let whatsappSent  = false
  let emailSent     = false
  let whatsappError: string | undefined
  let emailError:    string | undefined

  // --- WhatsApp ---
  const smsGuardians = guardians.filter(g => g.receivesSMS && g.phone)
  if (smsGuardians.length === 0) {
    whatsappError = 'SMS alacak velisi yok'
  } else {
    const body    = buildWhatsAppMessage(msgOpts)
    const results = await Promise.all(
      smsGuardians.map(g => sendWhatsApp(g.phone!, body))
    )
    whatsappSent = results.some(r => r.ok)
    if (!whatsappSent) {
      whatsappError = results.map(r => r.error).filter(Boolean).join('; ')
    }
  }

  // --- Email ---
  const emailGuardians = guardians.filter(g => g.receivesEmail && g.email)
  if (emailGuardians.length === 0) {
    emailError = 'E-posta alacak velisi yok'
  } else {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { subject, html } = buildAbsenceEmailHtml({ ...msgOpts, schoolEmail })
      const toEmails = emailGuardians.map(g => g.email!).filter(Boolean)
      const { error: resendErr } = await resend.emails.send({
        from:    `${schoolName} <${schoolEmail || 'noreply@school.edu.tr'}>`,
        to:      toEmails,
        subject,
        html,
      })
      if (resendErr) {
        emailError = resendErr.message
      } else {
        emailSent = true
      }
    } catch (err: unknown) {
      emailError = err instanceof Error ? err.message : String(err)
    }
  }

  const newStatus = whatsappSent || emailSent ? 'APPROVED' : 'FAILED'

  await prisma.absenceNotification.update({
    where: { id: notificationId },
    data: {
      status:        newStatus,
      sentAt:        new Date(),
      whatsappSent,
      emailSent,
      whatsappError: whatsappError ?? null,
      emailError:    emailError ?? null,
    },
  })

  return { whatsappSent, emailSent, whatsappError, emailError }
}
