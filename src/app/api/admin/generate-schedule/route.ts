import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkAiCredits, consumeAiCredits } from '@/lib/aiCredits'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { school: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // ── Credit check ──
    const creditCheck = await checkAiCredits(user.schoolId)
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: 'AI credit limit reached', creditsUsed: creditCheck.creditsUsed, creditsLimit: creditCheck.creditsLimit },
        { status: 429 }
      )
    }

    const { assignmentId } = await request.json()

    const assignment = await prisma.courseAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
        teacher: {
          include: { teacherSchedules: true }
        },
        class: {
          include: { schedules: true }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const existingSchedules = await prisma.schedule.findMany({
      where: {
        OR: [
          { teacherId: assignment.teacherId },
          assignment.classId ? { classId: assignment.classId } : {}
        ]
      }
    })

    const schoolSettings = user.school
    const lessonDurationHours = (schoolSettings.lessonDuration || 45) / 60
    const requiredSlots = Math.ceil(assignment.weeklyHours / lessonDurationHours)

    const prompt = `You are a school schedule optimizer. Generate a weekly schedule for the following:

Course: ${assignment.course.name} (${assignment.course.code})
Teacher: ${assignment.teacher.name}
${assignment.class ? `Class: ${assignment.class.name}` : 'No specific class'}
Weekly Hours Required: ${assignment.weeklyHours} hours

SCHOOL SCHEDULE SETTINGS:
- School hours: ${schoolSettings.schoolStartTime || '08:00'} - ${schoolSettings.schoolEndTime || '16:00'}
- Lesson duration: ${schoolSettings.lessonDuration || 45} minutes
- Break duration: ${schoolSettings.breakDuration || 10} minutes
- Lunch break: ${schoolSettings.lunchBreakStart || '12:00'} - ${schoolSettings.lunchBreakEnd || '13:00'}

CONSTRAINTS:
1. Only schedule during school hours (${schoolSettings.schoolStartTime || '08:00'} - ${schoolSettings.schoolEndTime || '16:00'})
2. Each session should be ${schoolSettings.lessonDuration || 45} minutes
3. Avoid consecutive sessions of the same course
4. No sessions during lunch (${schoolSettings.lunchBreakStart || '12:00'} - ${schoolSettings.lunchBreakEnd || '13:00'})
5. Distribute evenly across the week (Monday-Friday)
6. Add ${schoolSettings.breakDuration || 10} minutes break between lessons

EXISTING SCHEDULES (CONFLICTS TO AVOID):
${existingSchedules.map(s =>
  `Day ${s.dayOfWeek}: ${s.startTime}-${s.endTime}`
).join('\n')}

Generate EXACTLY ${requiredSlots} optimal time slots (no more, no less).

Return ONLY a JSON array with this format:
[
  {
    "dayOfWeek": 0,
    "startTime": "09:00",
    "endTime": "09:45",
    "reason": "Morning slot, no conflicts, optimal learning time"
  }
]

Days: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday
Times must be in HH:MM format and aligned to school settings.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert school schedule optimizer. Always return valid JSON arrays. Follow school settings strictly. Generate EXACTLY the requested number of slots.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    // ── Consume credits ──
    const tokensUsed = completion.usage?.total_tokens ?? 0
    await consumeAiCredits(user.schoolId, tokensUsed)

    const aiResponse = completion.choices[0].message.content || '[]'

    let suggestedSlots
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
      suggestedSlots = JSON.parse(cleanedResponse)
      suggestedSlots = suggestedSlots.slice(0, requiredSlots)
    } catch (error) {
      console.error('Failed to parse AI response:', aiResponse)
      return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
    }

    return NextResponse.json({ success: true, suggestedSlots, assignment })

  } catch (error: any) {
    console.error('Generate schedule error:', error)
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}
