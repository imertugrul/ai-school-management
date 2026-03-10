import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { type, details } = await request.json()

    // Create suspicious activity record
    await prisma.suspiciousActivity.create({
      data: {
        type,
        timestamp: new Date(),
        details: details || {},
        submissionId: params.id
      }
    })

    // Optionally update submission's tabSwitchCount if it's a tab switch
    if (type === 'TAB_SWITCH') {
      await prisma.submission.update({
        where: { id: params.id },
        data: {
          tabSwitchCount: {
            increment: 1
          }
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Report suspicious activity error:', error)
    return NextResponse.json({ 
      error: 'Failed to report activity' 
    }, { status: 500 })
  }
}


