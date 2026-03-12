import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 })
    }

    const { courses } = await request.json()

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: 'Invalid courses data' }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const course of courses) {
      try {
        // Check if course code already exists
        const existing = await prisma.course.findUnique({
          where: { code: course.code }
        })

        if (existing) {
          results.failed++
          results.errors.push(`Course ${course.code} already exists`)
          continue
        }

        await prisma.course.create({
          data: {
            code: course.code,
            name: course.name,
            description: course.description || null,
            credits: parseInt(course.credits) || 3,
            grade: course.grade || null,
            schoolId: user.schoolId
          }
        })

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Failed to import ${course.code}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('Import courses error:', error)
    return NextResponse.json({ 
      error: 'Failed to import courses' 
    }, { status: 500 })
  }
}
