import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import { logAiCall } from '@/lib/aiLogger'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-4-6'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const CURRICULUM_DESCRIPTIONS: Record<string, string> = {
  IB: 'International Baccalaureate (inquiry-based, ATL)',
  AP: 'Advanced Placement (college-level rigor)',
  NATIONAL: 'Türkiye Milli Müfredat (MEB)',
  IGCSE: 'Cambridge IGCSE',
  COMMON_CORE: 'US Common Core',
}

const SYSTEM_PROMPT = 'Sen deneyimli bir öğretmensin. Verilen bilgilere göre yapılandırılmış bir ders planı oluştur. Sadece geçerli JSON döndür — markdown veya açıklama yok.'

function extractJson(text: string): any {
  const cleaned = text.replace(/```(?:json)?/g, '').trim()
  try { return JSON.parse(cleaned) } catch { /* fall through */ }
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) { try { return JSON.parse(match[0]) } catch { /* ignore */ } }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    if (!anthropic) {
      return NextResponse.json({ error: 'AI servisi yapılandırılmamış (ANTHROPIC_API_KEY eksik).' }, { status: 500 })
    }

    const creditCheck = await checkAiCredits(user.schoolId ?? null)
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: 'AI credit limit reached', creditsUsed: creditCheck.creditsUsed, creditsLimit: creditCheck.creditsLimit },
        { status: 429 }
      )
    }

    const { courseId, curriculumType, unitName, topicDescription, duration = 45, classId } = await request.json()

    if (!courseId || !curriculumType || !unitName || !topicDescription) {
      return NextResponse.json({ error: 'courseId, curriculumType, unitName, and topicDescription are required' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const curriculumDesc = CURRICULUM_DESCRIPTIONS[curriculumType] || curriculumType
    const introMin = Math.round(duration * 0.15)
    const mainMin = Math.round(duration * 0.7)
    const closureMin = duration - introMin - mainMin

    const userPrompt = `Müfredat: ${curriculumType} — ${curriculumDesc}
Ders: ${course.name} (${course.code})
Sınıf seviyesi: ${course.grade || 'belirtilmedi'}
Ünite: ${unitName}
Konu/odak: ${topicDescription}
Süre: ${duration} dakika (giriş ~${introMin} dk, ana ~${mainMin} dk, kapanış ~${closureMin} dk)

Şu yapıda JSON döndür:
{
  "learningObjectives": ["Students will be able to ...", ...],   // 3-5
  "materialsNeeded": ["...", ...],                                // 5-8
  "slideOutline": [
    { "slide": 1, "title": "...", "duration": ${introMin}, "content": ["..."], "notes": "..." }
  ],                                                              // 5-8 slayt
  "activities": [
    { "name": "...", "duration": 10, "description": "...", "grouping": "individual|pairs|groups|whole-class" }
  ],                                                              // 3-4 aktivite
  "assessment": {
    "formative": ["...", ...],                                    // 2-3
    "summative": ["...", ...],                                    // 1-2
    "exitTicket": "..."
  }
}`

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

    const content = response.content[0]
    if (content.type !== 'text') {
      await logAiCall({ endpoint: '/api/teacher/lesson-plans/generate', tokensUsed, model: MODEL, questionType: 'lesson_plan', schoolId: user.schoolId ?? null })
      return NextResponse.json({ error: 'AI yanıtı geçersiz format döndürdü.' }, { status: 500 })
    }

    const generatedPlan = extractJson(content.text)
    if (!generatedPlan) {
      console.error('Failed to parse AI response:', content.text.slice(0, 500))
      await logAiCall({ endpoint: '/api/teacher/lesson-plans/generate', tokensUsed, model: MODEL, questionType: 'lesson_plan', schoolId: user.schoolId ?? null })
      return NextResponse.json({ error: 'AI yanıtı ayrıştırılamadı. Lütfen tekrar deneyin.' }, { status: 500 })
    }

    // Defensive defaults so the UI never crashes
    const safePlan = {
      learningObjectives: Array.isArray(generatedPlan.learningObjectives) ? generatedPlan.learningObjectives : [],
      materialsNeeded:    Array.isArray(generatedPlan.materialsNeeded) ? generatedPlan.materialsNeeded : [],
      slideOutline:       Array.isArray(generatedPlan.slideOutline) ? generatedPlan.slideOutline : [],
      activities:         Array.isArray(generatedPlan.activities) ? generatedPlan.activities : [],
      assessment: {
        formative:  Array.isArray(generatedPlan.assessment?.formative) ? generatedPlan.assessment.formative : [],
        summative:  Array.isArray(generatedPlan.assessment?.summative) ? generatedPlan.assessment.summative : [],
        exitTicket: generatedPlan.assessment?.exitTicket ?? '',
      },
    }

    await consumeAiCredits(user.schoolId ?? null, tokensUsed)
    await logAiCall({
      endpoint: '/api/teacher/lesson-plans/generate',
      tokensUsed,
      model: MODEL,
      questionType: 'lesson_plan',
      schoolId: user.schoolId ?? null,
    })

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        teacherId: user.id,
        courseId,
        classId: classId || null,
        curriculumType: curriculumType as any,
        unitName,
        title: `${unitName} – ${curriculumType}`,
        duration,
        learningObjectives: JSON.stringify(safePlan.learningObjectives),
        materialsNeeded:    JSON.stringify(safePlan.materialsNeeded),
        slideOutline:       JSON.stringify(safePlan.slideOutline),
        aiActivities:       JSON.stringify(safePlan.activities),
        aiAssessment:       JSON.stringify(safePlan.assessment),
        isAIGenerated: true,
        wasEdited: false,
        schoolId: user.schoolId,
      }
    })

    return NextResponse.json({
      success: true,
      lessonPlan: {
        id: lessonPlan.id,
        ...safePlan,
        courseName: course.name,
        courseCode: course.code,
        curriculumType,
        unitName,
        duration,
      }
    })

  } catch (error: any) {
    console.error('Generate lesson plan error:', error)
    const message = error?.error?.message || error?.message || 'Failed to generate lesson plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
