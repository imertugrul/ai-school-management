import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { name, school, email, phone, studentCount, message } = await request.json()

    if (!name?.trim() || !school?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const to = process.env.CONTACT_EMAIL ?? 'info@schoolproai.com'

    const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:32px">
    <h2 style="margin:0 0 4px;font-size:20px;color:#111827">Yeni Demo Talebi</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7280">schoolproai.com iletişim formu</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#6b7280;width:140px">Ad Soyad:</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Okul:</td><td style="padding:8px 0;font-weight:600">${school}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">E-posta:</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
      ${phone ? `<tr><td style="padding:8px 0;color:#6b7280">Telefon:</td><td style="padding:8px 0">${phone}</td></tr>` : ''}
      ${studentCount ? `<tr><td style="padding:8px 0;color:#6b7280">Öğrenci sayısı:</td><td style="padding:8px 0">${studentCount}</td></tr>` : ''}
    </table>

    ${message ? `
    <div style="margin-top:20px;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:8px">
      <p style="margin:0 0 8px;font-weight:600;color:#374151">Mesaj:</p>
      <p style="margin:0;color:#374151;line-height:1.6">${message.replace(/\n/g, '<br/>')}</p>
    </div>` : ''}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="margin:0;font-size:12px;color:#9ca3af">Bu e-posta schoolproai.com iletişim formu aracılığıyla gönderildi.</p>
  </div>
</body>
</html>`

    const sent = await sendEmail({
      to,
      subject: `Demo Talebi: ${name} — ${school}`,
      html,
    })

    if (!sent) {
      return NextResponse.json({ error: 'Email gönderilemedi' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact] Error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
