import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

function generatePassword(): string {
  return Math.random().toString(36).slice(-8)
}

function buildResetEmail(userName: string, newPassword: string): { subject: string; html: string } {
  return {
    subject: 'Şifreniz sıfırlandı / Your password has been reset',
    html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:32px">
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827">🔑 Şifreniz sıfırlandı</h2>
    <p>Merhaba <strong>${userName}</strong>,</p>
    <p>Hesabınızın şifresi okul yöneticisi tarafından sıfırlandı. Yeni şifreniz:</p>
    <div style="background:#fff;border:2px dashed #d1d5db;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
      <code style="font-family:ui-monospace,monospace;font-size:18px;font-weight:600;color:#111827;letter-spacing:1px">${newPassword}</code>
    </div>
    <p style="font-size:13px;color:#6b7280">Güvenliğiniz için giriş yaptıktan sonra şifrenizi değiştirmenizi öneririz.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="margin:0;font-size:12px;color:#9ca3af">This email was sent automatically. Please do not reply.</p>
  </div>
</body></html>`,
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (admin.id === params.id) {
      return NextResponse.json(
        { error: 'You cannot reset your own password from here. Use account settings instead.' },
        { status: 400 },
      )
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, schoolId: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (target.schoolId && admin.schoolId && target.schoolId !== admin.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const mode: 'manual' | 'auto' = body.mode === 'auto' ? 'auto' : 'manual'
    const wantsEmail = Boolean(body.sendEmail)

    let newPassword: string
    if (mode === 'auto') {
      newPassword = generatePassword()
    } else {
      newPassword = typeof body.password === 'string' ? body.password : ''
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 },
        )
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: target.id },
      data: { password: hashed },
    })

    let emailed = false
    if (wantsEmail && target.email) {
      const { subject, html } = buildResetEmail(target.name, newPassword)
      emailed = await sendEmail({ to: target.email, subject, html })
    }

    return NextResponse.json({
      success: true,
      mode,
      emailed,
      // Only expose the plaintext password to the admin when it was system-generated.
      password: mode === 'auto' ? newPassword : undefined,
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
