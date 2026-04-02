import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } })
    if (!user || user.role !== 'PARENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const appointments = await prisma.appointmentRequest.findMany({
      where: { parentId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(appointments)
  } catch (err) {
    console.error('GET /api/parent/appointments error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: { select: { name: true } } },
    })
    if (!user || user.role !== 'PARENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { studentName, subject, message, preferredTime, preferredDate } = await req.json()
    if (!studentName?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }

    const appointment = await prisma.appointmentRequest.create({
      data: {
        parentId: user.id,
        studentName: studentName.trim(),
        subject: subject.trim(),
        message: message.trim(),
        preferredTime: preferredTime?.trim() || null,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
      },
    })

    // Notify VP via email
    const vpEmail = process.env.CONTACT_EMAIL ?? 'contact@schoolproai.com'
    await sendEmail({
      to: vpEmail,
      subject: `Randevu Talebi: ${user.name} — ${studentName}`,
      html: `
<h2>Yeni Randevu Talebi</h2>
<p><strong>Veli:</strong> ${user.name} (${user.email})</p>
<p><strong>Öğrenci:</strong> ${studentName}</p>
<p><strong>Konu:</strong> ${subject}</p>
<p><strong>Mesaj:</strong> ${message}</p>
<p><strong>Tercih edilen zaman:</strong> ${preferredTime ?? 'Belirtilmedi'}</p>
<hr/>
<p style="font-size:12px;color:#9ca3af">Bu talep ${user.school?.name ?? ''} okul asistanı aracılığıyla iletildi.</p>`,
    })

    // Confirm to parent
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Randevu Talebiniz Alındı',
        html: `
<p>Sayın ${user.name},</p>
<p>Randevu talebiniz başarıyla alınmıştır.</p>
<p><strong>Konu:</strong> ${subject}</p>
<p><strong>Öğrenci:</strong> ${studentName}</p>
<p>Okul idaresi en kısa sürede size geri dönecektir.</p>`,
      })
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (err) {
    console.error('POST /api/parent/appointments error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
