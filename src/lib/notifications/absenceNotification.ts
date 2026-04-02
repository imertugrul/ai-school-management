/**
 * Absence notification delivery service
 * Sends WhatsApp (Twilio) and Email (Resend) to student guardians
 */
import { prisma } from '@/lib/prisma'

async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const rawFrom    = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

  if (!accountSid || !authToken) {
    console.error('[WhatsApp] Twilio credentials missing')
    return { ok: false, error: 'Twilio credentials not configured' }
  }

  // Clean number: keep only digits + leading +
  let cleanNumber = to.trim()
  cleanNumber = '+' + cleanNumber.replace(/[^0-9]/g, '')

  const toWhatsApp   = `whatsapp:${cleanNumber}`
  const fromWhatsApp = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`

  console.log('[WhatsApp] Sending:', { from: fromWhatsApp, to: toWhatsApp })

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const client = require('twilio')(accountSid, authToken)
    const result = await client.messages.create({ from: fromWhatsApp, to: toWhatsApp, body })
    console.log('[WhatsApp] Success:', result.sid)
    return { ok: true }
  } catch (err: any) {
    console.error('[WhatsApp] Twilio error full:', JSON.stringify(err))
    console.error('[WhatsApp] Twilio error message:', err.message)
    console.error('[WhatsApp] Twilio error code:', err.code)
    return { ok: false, error: err.message ?? String(err) }
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
  const dateStr     = opts.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const statusLabel = opts.attendanceStatus === 'ABSENT' ? 'absent' : 'late'
  return [
    `📢 *${opts.schoolName} — Absence Notification*`,
    ``,
    `Dear Parent/Guardian,`,
    ``,
    `We would like to inform you that *${opts.studentName}* was marked *${statusLabel}* on ${dateStr}.`,
    ``,
    `For further information please contact us,`,
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
  const dateStr     = opts.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const statusLabel = opts.attendanceStatus === 'ABSENT' ? 'Absent' : 'Late'
  const subject     = `Absence Notification — ${opts.studentName} — ${dateStr}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
        <tr><td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px 40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">📢 Absence Notification</h1>
          <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px">${opts.schoolName}</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="color:#374151;font-size:15px;margin:0 0 24px">Dear Parent/Guardian,</p>
          <table width="100%" cellpadding="12" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px">
            <tr>
              <td style="color:#6b7280;font-size:13px;width:40%">Student</td>
              <td style="color:#111827;font-size:14px;font-weight:600">${opts.studentName}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:13px">Class</td>
              <td style="color:#111827;font-size:14px">${opts.className}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:13px">Date</td>
              <td style="color:#111827;font-size:14px">${dateStr}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:13px">Status</td>
              <td style="color:#dc2626;font-size:14px;font-weight:600">${statusLabel}</td>
            </tr>
          </table>
          <p style="color:#374151;font-size:14px;line-height:1.6">If you have any questions, please do not hesitate to contact our school.</p>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">
            📞 ${opts.schoolPhone}<br>
            ✉️ ${opts.schoolEmail}
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="color:#9ca3af;font-size:12px;margin:0">${opts.schoolName} — Automated Notification System</p>
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

  const schoolName  = process.env.SCHOOL_NAME  || 'School'
  const schoolPhone = process.env.SCHOOL_PHONE  || ''
  const schoolEmail = process.env.SCHOOL_EMAIL  || ''

  // No guardians — mark FAILED
  if (guardians.length === 0) {
    await prisma.absenceNotification.update({
      where: { id: notificationId },
      data: {
        status:        'FAILED',
        emailError:    'No registered guardian found',
        whatsappError: 'No registered guardian found',
        sentAt:        new Date(),
      },
    })
    return { whatsappSent: false, emailSent: false, whatsappError: 'No guardian', emailError: 'No guardian' }
  }

  const msgOpts = {
    studentName:      notif.student.name || 'Student',
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
    whatsappError = 'No guardian configured to receive SMS'
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
    emailError = 'No guardian configured to receive email'
  } else {
    try {
      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        emailError = 'RESEND_API_KEY not configured'
        console.error('[Email] RESEND_API_KEY not set')
      } else {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)
        const { subject, html } = buildAbsenceEmailHtml({ ...msgOpts, schoolEmail })
        const toEmails = emailGuardians.map(g => g.email!).filter(Boolean)
        // Use EMAIL_FROM (Resend-verified sender domain) not SCHOOL_EMAIL
        const fromAddress = process.env.EMAIL_FROM || 'noreply@schoolproai.com'
        const { error: resendErr } = await resend.emails.send({
          from:    `${schoolName} <${fromAddress}>`,
          to:      toEmails,
          subject,
          html,
        })
        if (resendErr) {
          emailError = resendErr.message
          console.error('[Email] Resend error:', resendErr)
        } else {
          emailSent = true
        }
      }
    } catch (err: unknown) {
      emailError = err instanceof Error ? err.message : String(err)
      console.error('[Email] Unexpected error:', emailError)
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
