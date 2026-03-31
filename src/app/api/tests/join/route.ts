import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()
    if (!code) return NextResponse.json({ error: 'Kod gerekli' }, { status: 400 })

    const test = await prisma.test.findUnique({
      where: { accessCode: code },
      include: {
        testAssignments: { select: { studentId: true } },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Geçersiz kod — bu koda ait test bulunamadı.' }, { status: 404 })
    }

    if (test.status === 'DRAFT' || test.status === 'ASSIGNED') {
      return NextResponse.json({ error: 'Test henüz başlamadı. Öğretmenin testi başlatmasını bekle.' }, { status: 403 })
    }

    if (test.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Bu test sona erdi.' }, { status: 403 })
    }

    // Test is ACTIVE — check if student is assigned
    const student = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!student) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    const isAssigned = test.testAssignments.some(a => a.studentId === student.id)
    if (!isAssigned) {
      return NextResponse.json({ error: 'Bu teste erişim izniniz yok. Öğretmeninizle iletişime geçin.' }, { status: 403 })
    }

    return NextResponse.json({ success: true, testId: test.id })
  } catch (error) {
    console.error('Join test error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}
