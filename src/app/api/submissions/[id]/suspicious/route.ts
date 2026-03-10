import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activity = await request.json()

    const submission = await prisma.submission.findUnique({
      where: { id: params.id }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const currentActivities = (submission.suspiciousActivity as any[]) || []
    currentActivities.push(activity)

    await prisma.submission.update({
      where: { id: params.id },
      data: {
        suspiciousActivity: currentActivities
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log suspicious error:', error)
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  }
}
