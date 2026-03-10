import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { currentQuestionIndex, tabSwitchCount } = await request.json()

    await prisma.submission.update({
      where: { id: params.id },
      data: {
        currentQuestionIndex,
        tabSwitchCount,
        lastActiveAt: new Date(),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
