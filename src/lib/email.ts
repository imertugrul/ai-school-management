/**
 * Email service using Resend.
 * Requires RESEND_API_KEY and EMAIL_FROM environment variables.
 */
import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'noreply@schoolpro.ai'

export interface SendEmailParams {
  to:      string
  subject: string
  html:    string
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — email not sent.')
    return false
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { error } = await resend.emails.send({
      from:    FROM,
      to:      params.to,
      subject: params.subject,
      html:    params.html,
    })
    if (error) {
      console.error('[Email] Resend error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[Email] Send failed:', err)
    return false
  }
}

/** Build GDPR Art. 17 deletion notification email HTML */
export function buildGdprDeletionEmail(opts: {
  parentName:   string
  studentName:  string
  deletedAt:    string
  adminName:    string
  schoolName:   string
  schoolEmail:  string
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:32px">

    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Data Deletion Request Completed</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280">GDPR / Data Privacy — Article 17</p>

    <p>Dear <strong>${opts.parentName}</strong>,</p>

    <p>
      All personal data belonging to <strong>${opts.studentName}</strong> has been permanently deleted from our system
      in accordance with GDPR Article 17.
    </p>

    <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0 0 8px;font-weight:600;color:#065f46">Deleted data:</p>
      <ul style="margin:0;padding-left:20px;color:#374151;line-height:2">
        <li>✓ Exam results and answers</li>
        <li>✓ Grade records</li>
        <li>✓ Attendance records</li>
        <li>✓ Enrollment information</li>
        <li>✓ User account</li>
      </ul>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr>
        <td style="padding:6px 0;color:#6b7280">Deletion date:</td>
        <td style="padding:6px 0;font-weight:500">${opts.deletedAt}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280">Performed by:</td>
        <td style="padding:6px 0;font-weight:500">${opts.adminName}</td>
      </tr>
    </table>

    <p style="font-size:13px;color:#6b7280;margin-top:24px">
      This email was generated automatically.<br/>
      For questions please contact: <a href="mailto:${opts.schoolEmail}" style="color:#2563eb">${opts.schoolEmail}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${opts.schoolName}</p>
  </div>
</body>
</html>`
}
