import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
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
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { assignmentId } = await request.json()

    // Get assignment details
    const assignment = await prisma.courseAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
        teacher: {
          include: {
            teacherSchedules: true
          }
        },
        class: {
          include: {
            schedules: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get all existing schedules for conflict detection
    const existingSchedules = await prisma.schedule.findMany({
      where: {
        OR: [
          { teacherId: assignment.teacherId },
          assignment.classId ? { classId: assignment.classId } : {}
        ]
      }
    })

    // Prepare AI prompt
    const prompt = `You are a school schedule optimizer. Generate a weekly schedule for the following:

Course: ${assignment.course.name} (${assignment.course.code})
Teacher: ${assignment.teacher.name}
${assignment.class ? `Class: ${assignment.class.name}` : 'No specific class'}
Weekly Hours Required: ${assignment.weeklyHours} hours

CONSTRAINTS:
1. School hours: Monday-Friday, 8:00 AM - 4:00 PM
2. Each session should be 1-2 hours
3. Avoid consecutive sessions of the same course
4. No sessions during lunch (12:00-13:00)
5. Distribute evenly across the week

EXISTING SCHEDULES (CONFLICTS TO AVOID):
${existingSchedules.map(s => 
  `Day ${s.dayOfWeek}: ${s.startTime}-${s.endTime}`
).join('\n')}

Generate ${Math.ceil(assignment.weeklyHours / 1.5)} optimal time slots.

Return ONLY a JSON array with this format:
[
  {
    "dayOfWeek": 0,
    "startTime": "09:00",
    "endTime": "10:30",
    "reason": "Morning slot, no conflicts"
  }
]

Days: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert school schedule optimizer. Always return valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0].message.content || '[]'
    
    // Parse AI response
    let suggestedSlots
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
      suggestedSlots = JSON.parse(cleanedResponse)
    } catch (error) {
      console.error('Failed to parse AI response:', aiResponse)
      return NextResponse.json({ 
        error: 'Failed to generate schedule' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      suggestedSlots,
      assignment 
    })

  } catch (error: any) {
    console.error('Generate schedule error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate schedule' 
    }, { status: 500 })
  }
}
