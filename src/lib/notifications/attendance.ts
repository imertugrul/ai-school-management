/**
 * Attendance notification message generator.
 *
 * KVKK / GDPR: Student name, email, class name, and school name are NOT sent
 * to the OpenAI API. Only the attendance status and date are included in the prompt.
 */
import { openai } from '@/lib/openai'

interface AttendanceNotificationData {
  studentName: string   // used only in fallback messages (never sent to AI)
  date: string
  status: string
  parentName?: string   // used only in fallback messages
  className?: string    // NOT sent to AI
}

export async function generateAttendanceMessage(data: AttendanceNotificationData): Promise<string> {
  try {
    // ── Anonymized prompt: no student name, class name, or school name ──
    const prompt = `
Generate a polite, professional parent notification message about student attendance.

Date: ${data.date}
Attendance Status: ${data.status}

Create a SHORT message (2-3 sentences) that:
- Is warm and professional
- States the attendance status clearly
- Encourages contact if needed
- Uses "your child" instead of any specific name

Return ONLY the message text, no quotes or formatting.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    })

    return response.choices[0].message.content || getDefaultMessage(data)
  } catch (error) {
    console.error('AI message generation error:', error)
    return getDefaultMessage(data)
  }
}

function getDefaultMessage(data: AttendanceNotificationData): string {
  const messages = {
    ABSENT:  `Hello! Your child was marked absent on ${data.date}. If this is unexpected, please contact the school. Thank you.`,
    LATE:    `Hello! Your child arrived late on ${data.date}. Please ensure timely arrival. Thank you.`,
    PRESENT: `Hello! Your child was present on ${data.date}. Have a great day!`,
    EXCUSED: `Hello! Your child's absence on ${data.date} has been marked as excused. Thank you for informing us.`,
  }
  return messages[data.status as keyof typeof messages] ?? `Attendance update on ${data.date}: ${data.status}`
}

export async function sendAttendanceNotification(
  studentEmail: string,
  message: string,
  type: 'EMAIL' | 'SMS' = 'EMAIL'
): Promise<boolean> {
  try {
    // TODO: Integrate with actual email/SMS service (SendGrid, Twilio)
    console.log(`[${type}] Sending to ${studentEmail}: ${message}`)
    return true
  } catch (error) {
    console.error('Notification send error:', error)
    return false
  }
}
