/**
 * GET /api/debug/notifications
 * Admin-only: check which notification env vars are configured.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true } })
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rawTwilioFrom = process.env.TWILIO_WHATSAPP_FROM ?? ''

  return NextResponse.json({
    twilio: {
      accountSid:  process.env.TWILIO_ACCOUNT_SID  ? 'SET' : 'MISSING',
      authToken:   process.env.TWILIO_AUTH_TOKEN   ? 'SET' : 'MISSING',
      whatsappFrom: rawTwilioFrom
        ? (rawTwilioFrom.startsWith('whatsapp:')
            ? `SET (prefix ok) → will send as whatsapp:${rawTwilioFrom.replace(/^whatsapp:/, '')}`
            : `SET (no prefix) → will send as whatsapp:${rawTwilioFrom}`)
        : 'MISSING',
    },
    resend: {
      apiKey:    process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
      emailFrom: process.env.EMAIL_FROM     ? `SET → ${process.env.EMAIL_FROM}` : 'MISSING (will use noreply@schoolproai.com)',
    },
    school: {
      name:  process.env.SCHOOL_NAME  || 'NOT SET (default: School)',
      phone: process.env.SCHOOL_PHONE || 'NOT SET',
      email: process.env.SCHOOL_EMAIL || 'NOT SET',
    },
    note: 'SCHOOL_EMAIL is shown in notification body only. Email is SENT FROM EMAIL_FROM (must be Resend-verified domain).',
  })
}
