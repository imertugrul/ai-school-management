import { openai } from '@/lib/openai'

interface AttendanceNotificationData {
  studentName: string
  date: string
  status: string
  parentName?: string
  className?: string
}

export async function generateAttendanceMessage(data: AttendanceNotificationData): Promise<string> {
  try {
    const prompt = `
Generate a polite, professional parent notification message about student attendance.

Student: ${data.studentName}
Class: ${data.className || 'N/A'}
Date: ${data.date}
Status: ${data.status}
Parent: ${data.parentName || 'Dear Parent'}

Create a SHORT message (2-3 sentences) in English that:
- Is warm and professional
- States the attendance status clearly
- Encourages contact if needed

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
    ABSENT: `Hello! ${data.studentName} was marked absent on ${data.date}. If this is unexpected, please contact the school. Thank you.`,
    LATE: `Hello! ${data.studentName} arrived late on ${data.date}. Please ensure timely arrival. Thank you.`,
    PRESENT: `Hello! ${data.studentName} was present on ${data.date}. Have a great day!`,
    EXCUSED: `Hello! ${data.studentName}'s absence on ${data.date} has been marked as excused. Thank you for informing us.`
  }
  
  return messages[data.status as keyof typeof messages] || `Attendance update for ${data.studentName} on ${data.date}: ${data.status}`
}

export async function sendAttendanceNotification(
  studentEmail: string,
  message: string,
  type: 'EMAIL' | 'SMS' = 'EMAIL'
): Promise<boolean> {
  try {
    // TODO: Integrate with actual email/SMS service (SendGrid, Twilio)
    console.log(`[${type}] Sending to ${studentEmail}: ${message}`)
    
    // For now, just log it
    // In production, you'd call SendGrid/Twilio API here
    
    return true
  } catch (error) {
    console.error('Notification send error:', error)
    return false
  }
}
