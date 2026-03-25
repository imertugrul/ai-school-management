import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function getStudentAndGrade(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { class: { select: { grade: true, name: true } }, school: { select: { name: true } } },
  })
  return user
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getStudentAndGrade(session.user.email)
    if (!user || user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const isNinthGrade = user.class?.grade === '9'

    let profile = await prisma.universityProfile.findUnique({ where: { studentId: user.id } })

    return NextResponse.json({
      success: true,
      isNinthGrade,
      student: { name: user.name, className: user.class?.name, schoolName: user.school?.name },
      profile: profile ?? null,
    })
  } catch (error: any) {
    console.error('UniPath profile GET error:', error)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getStudentAndGrade(session.user.email)
    if (!user || user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (user.class?.grade !== '9') return NextResponse.json({ error: 'Not available for your grade' }, { status: 403 })

    const body = await request.json()

    // Whitelist updatable fields
    const allowed = [
      'targetRegion', 'educationLevel', 'startYear', 'fieldOfInterest', 'scholarshipNeeded',
      'diplomaSystem', 'gradeSystem', 'gpa', 'currentGrade', 'examScores',
      'activities', 'portfolioStatus', 'portfolioItems', 'recommendationLetters',
      'universityList', 'documentStatus', 'applicationYear', 'nextDeadline', 'lastActivePhase',
    ]
    const data: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) data[key] = body[key]
    }

    const profile = await prisma.universityProfile.upsert({
      where: { studentId: user.id },
      create: { studentId: user.id, ...data },
      update: data,
    })

    return NextResponse.json({ success: true, profile })
  } catch (error: any) {
    console.error('UniPath profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
