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
    const sid      = process.env.TWILIO_ACCOUNT_SID
    const token    = process.env.TWILIO_AUTH_TOKEN
    const rawFrom  = process.env.TWILIO_WHATSAPP_FROM
    if (!sid || !token || !rawFrom) {
      results.whatsapp = { status: 'ERROR', reason: 'Twilio env vars missing (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM)' }
    } else {
      const fromNumber = rawFrom.replace(/^whatsapp:/, '')
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const client = require('twilio')(sid, token)
        const g = smsGuardians[0]
        const digits = g.phone!.replace(/\D/g, '')
        const e164 = digits.startsWith('90') && digits.length === 12 ? `+${digits}`
          : digits.startsWith('0') && digits.length === 11 ? `+90${digits.slice(1)}`
          : digits.length === 10 ? `+90${digits}`
          : null
        if (!e164) {
          results.whatsapp = { status: 'ERROR', reason: `Cannot convert "${g.phone}" to E.164 format` }
        } else {
          await client.messages.create({
            from: `whatsapp:${fromNumber}`,
            to:   `whatsapp:${e164}`,
            body: `[TEST] SchoolPro AI bildirim testi — ${student.name} için veli bildirimleri çalışıyor. ✅`,
          })
          results.whatsapp = { status: 'SENT', to: e164, guardian: g.name }
        }
      } catch (err: unknown) {
        results.whatsapp = { status: 'ERROR', reason: err instanceof Error ? err.message : String(err) }
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
