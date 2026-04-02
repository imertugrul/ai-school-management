/**
 * GET /api/debug/test-notification?studentId=XXX
 * Admin-only: inspect a student's guardians and fire a test WhatsApp + email.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true } })
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const studentId = request.nextUrl.searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'Missing studentId param' }, { status: 400 })

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const guardians = await prisma.guardian.findMany({ where: { studentId } })

  const guardianInfo = guardians.map(g => ({
    id:            g.id,
    name:          g.name,
    phone:         g.phone || null,
    email:         g.email || null,
    receivesSMS:   g.receivesSMS,
    receivesEmail: g.receivesEmail,
    isPrimary:     g.isPrimary,
  }))

  if (guardians.length === 0) {
    return NextResponse.json({
      student: student.name,
      guardians: [],
      result: 'NO_GUARDIANS — add a guardian first in the Parents panel.',
    })
  }

  const results: Record<string, unknown> = { student: student.name, guardians: guardianInfo }

  // ── Test WhatsApp ──────────────────────────────────────────
  const smsGuardians = guardians.filter(g => g.receivesSMS && g.phone)
  if (smsGuardians.length === 0) {
    results.whatsapp = {
      status: 'SKIPPED',
      reason: 'No guardian has receivesSMS=true AND a phone number. Enable SMS in the guardian settings.',
    }
  } else {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken  = process.env.TWILIO_AUTH_TOKEN
    const rawFrom    = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
    if (!accountSid || !authToken) {
      results.whatsapp = { status: 'ERROR', reason: 'Twilio env vars missing (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)' }
    } else {
      const g = smsGuardians[0]
      const cleanNumber  = '+' + g.phone!.replace(/[^0-9]/g, '')
      const toWhatsApp   = `whatsapp:${cleanNumber}`
      const fromWhatsApp = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`
      console.log('[DEBUG] Twilio sending:', { from: fromWhatsApp, to: toWhatsApp })
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const client = require('twilio')(accountSid, authToken)
        const msg = await client.messages.create({
          from: fromWhatsApp,
          to:   toWhatsApp,
          body: `[TEST] SchoolPro AI bildirim testi — ${student.name} için veli bildirimleri çalışıyor. ✅`,
        })
        console.log('[DEBUG] Twilio success:', msg.sid)
        results.whatsapp = { status: 'SENT', to: toWhatsApp, guardian: g.name, sid: msg.sid }
      } catch (err: any) {
        console.error('[DEBUG] Twilio error full:', JSON.stringify(err))
        console.error('[DEBUG] Twilio error code:', err.code)
        results.whatsapp = { status: 'ERROR', reason: err.message ?? String(err), code: err.code }
      }
    }
  }

  // ── Test Email ─────────────────────────────────────────────
  const emailGuardians = guardians.filter(g => g.receivesEmail && g.email)
  if (emailGuardians.length === 0) {
    results.email = {
      status: 'SKIPPED',
      reason: 'No guardian has receivesEmail=true AND an email address.',
    }
  } else {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      results.email = { status: 'ERROR', reason: 'RESEND_API_KEY not set' }
    } else {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)
        const fromAddress = process.env.EMAIL_FROM || 'noreply@schoolproai.com'
        const toEmails = emailGuardians.map(g => g.email!)
        const { error: resendErr } = await resend.emails.send({
          from:    `SchoolPro AI <${fromAddress}>`,
          to:      toEmails,
          subject: `[TEST] Bildirim Testi — ${student.name}`,
          html:    `<p>Bu bir test e-postasıdır. SchoolPro AI devamsızlık bildirimleri çalışıyor. ✅</p><p>Öğrenci: <strong>${student.name}</strong></p>`,
        })
        if (resendErr) {
          results.email = { status: 'ERROR', reason: resendErr.message }
        } else {
          results.email = { status: 'SENT', to: toEmails }
        }
      } catch (err: unknown) {
        results.email = { status: 'ERROR', reason: err instanceof Error ? err.message : String(err) }
      }
    }
  }

  return NextResponse.json(results)
}
