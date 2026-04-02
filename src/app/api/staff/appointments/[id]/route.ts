import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true, name: true } })
    if (!user || !['ADMIN', 'VICE_PRINCIPAL', 'COUNSELOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status, response } = await req.json()
    if (!['CONFIRMED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
    }

    const appointment = await prisma.appointmentRequest.update({
      where: { id: params.id },
      data: {
        status,
        response: response?.trim() || null,
        assignedTo: user.id,
      },
      include: { parent: { select: { name: true, email: true } } },
    })

    // Notify parent
    if (appointment.parent.email) {
      const isConfirmed = status === 'CONFIRMED'
      await sendEmail({
        to: appointment.parent.email,
        subject: isConfirmed ? 'Randevunuz Onaylandı' : 'Randevu Talebi Hakkında',
        html: `
<p>Sayın ${appointment.parent.name},</p>
<p>${isConfirmed
  ? `<strong>${appointment.subject}</strong> konusundaki randevu talebiniz onaylanmıştır.`
  : `<strong>${appointment.subject}</strong> konusundaki randevu talebiniz değerlendirilmiştir.`
}</p>
${response ? `<p><strong>Yanıt:</strong> ${response}</p>` : ''}
<hr/>
<p style="font-size:12px;color:#9ca3af">SchoolPro AI — Okul Asistanı</p>`,
      })
    }

    return NextResponse.json(appointment)
  } catch (err) {
    console.error('PATCH /api/staff/appointments/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
