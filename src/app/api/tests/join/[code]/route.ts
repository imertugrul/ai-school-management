import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const test = await prisma.test.findUnique({
      where: {
        accessCode: params.code
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        startDate: true,
        endDate: true,
      }
    })

    if (!test) {
      return NextResponse.json({ 
        success: false,
        error: 'Test not found. Please check the code.' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      test
    })

  } catch (error: any) {
    console.error('Find test error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to find test' 
    }, { status: 500 })
  }
}

