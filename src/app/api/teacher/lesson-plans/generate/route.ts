import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CURRICULUM_DESCRIPTIONS: Record<string, string> = {
  IB: 'International Baccalaureate – inquiry-based, conceptual learning with international mindedness and ATL skills',
  AP: 'Advanced Placement – college-level rigor preparing students for AP exams with rigorous content',
  NATIONAL: 'Turkish National Curriculum (MEB) – aligned with Milli Müfredat standards and Turkish educational objectives',
  IGCSE: 'International GCSE – Cambridge curriculum with global perspective and practical application',
  COMMON_CORE: 'US Common Core – college and career readiness standards focusing on critical thinking',
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

    // ── Credit check ──
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

    const prompt = `You are an expert curriculum designer and educator. Generate a comprehensive lesson plan.

CURRICULUM TYPE: ${curriculumType} – ${curriculumDesc}
COURSE: ${course.name} (${course.code})
GRADE LEVEL: ${course.grade || 'Not specified'}
UNIT NAME: ${unitName}
LESSON TOPIC & FOCUS: ${topicDescription}
LESSON DURATION: ${duration} minutes

Generate a detailed, ready-to-use lesson plan with exactly these sections:

1. LEARNING OBJECTIVES (3-5 objectives)
   - Use Bloom's Taxonomy verbs
   - Be specific and measurable
   - Align with ${curriculumType} standards
   - Directly address the teacher's stated lesson focus
   - Format: "Students will be able to..."

2. MATERIALS NEEDED (5-8 items)
   - Teaching materials, student materials, technology requirements

3. SLIDE OUTLINE (5-8 slides)
   - Break into logical sections with timing
   - Include what to show/say per slide

4. ACTIVITIES (3-4 activities)
   - Engaging, varied (individual, pairs, group)
   - Include timing and clear instructions

5. ASSESSMENT
   - 2-3 formative strategies (during lesson)
   - 1-2 summative ideas (after lesson)
   - Exit ticket idea

Return ONLY valid JSON (no markdown, no explanation, just JSON):
{
  "learningObjectives": ["string", ...],
  "materialsNeeded": ["string", ...],
  "slideOutline": [
    { "slide": 1, "title": "string", "duration": 5, "content": ["string", ...], "notes": "string" },
    ...
  ],
  "activities": [
    { "name": "string", "duration": 10, "description": "string", "grouping": "individual|pairs|groups|whole-class" },
    ...
  ],
  "assessment": {
    "formative": ["string", ...],
    "summative": ["string", ...],
    "exitTicket": "string"
  }
}`

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: prompt
      }],
      system: 'You are an expert educator and curriculum designer. Return ONLY valid JSON with no markdown code blocks, no explanations. Just the raw JSON object.'
    })

    // ── Consume credits (Anthropic: input + output tokens) ──
    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)
    await consumeAiCredits(user.schoolId ?? null, tokensUsed)

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    let generatedPlan
    try {
      const cleaned = content.text.replace(/```json\n?|\n?```/g, '').trim()
      generatedPlan = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse AI response:', content.text)
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
    }

    // Save to database
    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        teacherId: user.id,
        courseId,
        classId: classId || null,
        curriculumType: curriculumType as any,
        unitName,
        title: `${unitName} – ${curriculumType}`,
        duration,
        learningObjectives: JSON.stringify(generatedPlan.learningObjectives),
        materialsNeeded: JSON.stringify(generatedPlan.materialsNeeded),
        slideOutline: JSON.stringify(generatedPlan.slideOutline),
        aiActivities: JSON.stringify(generatedPlan.activities),
        aiAssessment: JSON.stringify(generatedPlan.assessment),
        isAIGenerated: true,
        wasEdited: false,
        schoolId: user.schoolId,
      }
    })

    return NextResponse.json({
      success: true,
      lessonPlan: {
        id: lessonPlan.id,
        ...generatedPlan,
        courseName: course.name,
        courseCode: course.code,
        curriculumType,
        unitName,
        duration,
      }
    })

  } catch (error: any) {
    console.error('Generate lesson plan error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate lesson plan' }, { status: 500 })
  }
}
