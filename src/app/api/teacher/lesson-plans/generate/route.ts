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

const SYSTEM_PROMPT = 'Sen deneyimli bir öğretmensin. Yapılandırılmış ders planı oluştur. SADECE geçerli JSON döndür — açıklama, yorum, markdown veya kod bloğu ekleme.'

function extractJson(text: string): any {
  // 1) ```json ... ``` veya ``` ... ``` blok
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1].trim()) } catch { /* fall through */ }
  }

  // 2) İlk { → son } dilim
  const braceStart = text.indexOf('{')
  const braceEnd = text.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    const sliced = text.slice(braceStart, braceEnd + 1)
    try { return JSON.parse(sliced) } catch { /* fall through */ }
  }

  // 3) Ham metni dene
  try { return JSON.parse(text.trim()) } catch { /* fall through */ }

  console.error('JSON parse failed. Raw response (first 2000 chars):', text.slice(0, 2000))
  return null
}

function fallbackPlanFromText(text: string, duration: number) {
  return {
    learningObjectives: [],
    materialsNeeded: [],
    slideOutline: [{
      slide: 1,
      title: 'AI yanıtı (ham metin)',
      duration,
      content: text.split('\n').filter(l => l.trim() !== '').slice(0, 40),
      notes: 'AI yanıtı JSON olarak ayrıştırılamadı. Lütfen elle düzenleyin veya tekrar oluşturun.',
    }],
    activities: [],
    assessment: { formative: [], summative: [], exitTicket: '' },
  }
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

Beklentiler: 3-5 learning objective, 5-8 materyal, 5-8 slayt, 3-4 aktivite, 2-3 formative + 1-2 summative + 1 exitTicket.

Tam olarak şu şemada JSON döndür:
{
  "learningObjectives": ["Students will be able to ..."],
  "materialsNeeded": ["..."],
  "slideOutline": [
    { "slide": 1, "title": "...", "duration": ${introMin}, "content": ["..."], "notes": "..." }
  ],
  "activities": [
    { "name": "...", "duration": 10, "description": "...", "grouping": "individual" }
  ],
  "assessment": {
    "formative": ["..."],
    "summative": ["..."],
    "exitTicket": "..."
  }
}

SADECE geçerli JSON döndür. Başka hiçbir metin, açıklama veya kod bloğu ekleme. "grouping" değeri sadece şu olabilir: individual | pairs | groups | whole-class.`

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)
    console.log(`[lesson-plans/generate] model=${MODEL} stop_reason=${response.stop_reason} input=${response.usage?.input_tokens} output=${response.usage?.output_tokens}`)

    const content = response.content[0]
    if (content.type !== 'text') {
      await logAiCall({ endpoint: '/api/teacher/lesson-plans/generate', tokensUsed, model: MODEL, questionType: 'lesson_plan', schoolId: user.schoolId ?? null })
      return NextResponse.json({ error: 'AI yanıtı geçersiz format döndürdü.' }, { status: 500 })
    }

    const truncated = response.stop_reason === 'max_tokens'
    const parsed = extractJson(content.text)
    const generatedPlan = parsed ?? fallbackPlanFromText(content.text, duration)
    const usedFallback = !parsed

    if (usedFallback) {
      console.warn(`[lesson-plans/generate] JSON parse failed (truncated=${truncated}). Fallback plan used.`)
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
      usedFallback,
      truncated,
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
