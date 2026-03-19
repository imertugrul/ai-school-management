import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a schedule parser. Extract schedule entries from the provided document (image or text).

Return ONLY a valid JSON array. No explanation, no markdown, just the JSON array.

Each entry must have exactly these fields:
{
  "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
  "startTime": "HH:MM" (24-hour format),
  "endTime": "HH:MM" (24-hour format),
  "courseName": "string (course name or code)",
  "classLevel": "string (e.g. 9A, 10B, Grade 9, etc.)",
  "room": "string or null"
}

Rules:
- Convert all day names to English (Pazartesi→Monday, Salı→Tuesday, Çarşamba→Wednesday, Perşembe→Thursday, Cuma→Friday)
- Convert 12-hour to 24-hour format if needed
- If room is not mentioned, use null
- If class level is not clear, make your best guess from context
- Ignore breaks, lunch, empty slots
- Only include actual class/lesson entries`

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileType = file.type
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let entries: any[] = []

    if (fileType === 'application/pdf') {
      // Extract text from PDF then send to Claude
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(buffer)
      const text = pdfData.text

      if (!text.trim()) {
        return NextResponse.json({ error: 'Could not extract text from PDF. Try uploading an image instead.' }, { status: 400 })
      }

      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Extract the schedule from this text:\n\n${text}`
        }],
        system: SYSTEM_PROMPT
      })

      const content = response.content[0]
      if (content.type !== 'text') throw new Error('Unexpected response type')
      entries = JSON.parse(content.text.trim())

    } else if (fileType.startsWith('image/')) {
      // Send image to Claude Vision
      const base64 = buffer.toString('base64')
      const mediaType = fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: 'Extract all schedule entries from this schedule image.'
            }
          ]
        }],
        system: SYSTEM_PROMPT
      })

      const content = response.content[0]
      if (content.type !== 'text') throw new Error('Unexpected response type')
      entries = JSON.parse(content.text.trim())

    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or image (JPG, PNG).' }, { status: 400 })
    }

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'Could not parse schedule from file.' }, { status: 422 })
    }

    return NextResponse.json({ success: true, entries })

  } catch (error: any) {
    console.error('Schedule parse error:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Could not interpret the schedule structure. Try a clearer image.' }, { status: 422 })
    }
    return NextResponse.json({ error: error.message || 'Failed to parse schedule' }, { status: 500 })
  }
}
