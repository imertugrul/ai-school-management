import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testId } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Mevcut submission var mı kontrol et
    let submission = await prisma.submission.findUnique({
      where: {
        testId_studentId: {
          testId,
          studentId: user.id
        }
      },
      include: {
        answers: true
      }
    })

    // Yoksa yeni oluştur
    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          testId,
          studentId: user.id,
          status: 'IN_PROGRESS',
          currentQuestionIndex: 0,
          tabSwitchCount: 0,
          lastActiveAt: new Date(),
        },
        include: {
          answers: true
        }
      })
    } else {
      // Varsa lastActiveAt'i güncelle
      submission = await prisma.submission.update({
        where: { id: submission.id },
        data: { lastActiveAt: new Date() },
        include: { answers: true }
      })
    }

    return NextResponse.json({
      success: true,
      submission
    })
  } catch (error) {
    console.error('Start submission error:', error)
    return NextResponse.json({ error: 'Failed to start submission' }, { status: 500 })
  }
}
