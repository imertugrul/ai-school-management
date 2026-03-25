import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

function buildChecklist(profile: any) {
  const regions: string[] = profile?.targetRegion ?? []
  const hasUS = regions.includes('US')
  const hasUK = regions.includes('UK')
  const hasEU = regions.includes('EU')

  const sections = []

  // Academic documents
  const academicDocs = [
    { id: 'transcript', label: 'High school transcript', category: 'academic' },
    { id: 'translation', label: 'Certified English translation', category: 'academic' },
  ]
  if (hasUS) academicDocs.push({ id: 'naces', label: 'NACES/WES credential evaluation', category: 'academic' })
  sections.push({ title: '📁 Academic Documents', items: academicDocs })

  // Test scores
  const testItems = [
    { id: 'toefl_ielts', label: hasUK ? 'IELTS 6.5+' : 'TOEFL 90+ or IELTS 6.5+', category: 'test' },
  ]
  if (hasUS) {
    testItems.push({ id: 'sat_act', label: 'SAT/ACT (optional but recommended)', category: 'test' })
  }
  sections.push({ title: '📝 Test Scores', items: testItems })

  // Recommendation letters
  sections.push({
    title: '✉️ Recommendation Letters',
    items: [
      { id: 'rec_teacher1', label: 'Teacher recommendation #1', category: 'rec' },
      { id: 'rec_teacher2', label: 'Teacher recommendation #2', category: 'rec' },
      { id: 'rec_counselor', label: 'School counselor recommendation', category: 'rec' },
    ],
  })

  // Essays
  const essayItems = []
  if (hasUS) {
    essayItems.push({ id: 'common_app', label: 'Common App Personal Essay (650 words)', category: 'essay' })
    essayItems.push({ id: 'supplemental', label: 'Supplemental essays (per school)', category: 'essay' })
  }
  if (hasUK) {
    essayItems.push({ id: 'ucas', label: 'UCAS Personal Statement (4000 chars)', category: 'essay' })
  }
  if (essayItems.length > 0) sections.push({ title: '📄 Essays', items: essayItems })

  // Platform accounts
  const platformItems = []
  if (hasUS) platformItems.push({ id: 'common_app_acc', label: 'Common App account created', category: 'platform' })
  if (hasUK) platformItems.push({ id: 'ucas_acc', label: 'UCAS account created', category: 'platform' })
  if (platformItems.length > 0) sections.push({ title: '💻 Platform Accounts', items: platformItems })

  // Merge with existing documentStatus
  const docStatus: Record<string, string> = profile?.documentStatus ?? {}
  const result = sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      status: (docStatus[item.id] as string) ?? 'not_started',
    })),
  }))

  return result
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { class: { select: { grade: true } } },
    })
    if (!user || user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (user.class?.grade !== '9') return NextResponse.json({ error: 'Not available' }, { status: 403 })

    const profile = await prisma.universityProfile.findUnique({ where: { studentId: user.id } })
    const checklist = buildChecklist(profile)

    return NextResponse.json({ success: true, checklist })
  } catch (error: any) {
    console.error('UniPath checklist error:', error)
    return NextResponse.json({ error: 'Failed to get checklist' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { class: { select: { grade: true } } },
    })
    if (!user || user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (user.class?.grade !== '9') return NextResponse.json({ error: 'Not available' }, { status: 403 })

    const { itemId, status } = await request.json()
    if (!itemId || !status) return NextResponse.json({ error: 'itemId and status required' }, { status: 400 })

    const profile = await prisma.universityProfile.findUnique({ where: { studentId: user.id } })
    const current: Record<string, string> = (profile?.documentStatus as Record<string, string>) ?? {}
    current[itemId] = status

    await prisma.universityProfile.upsert({
      where: { studentId: user.id },
      create: { studentId: user.id, documentStatus: current },
      update: { documentStatus: current },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
  }
}
