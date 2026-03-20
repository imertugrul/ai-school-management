import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { put } from '@vercel/blob'

// Max file sizes per type
const MAX_SIZES: Record<string, number> = {
  image:    10 * 1024 * 1024,  // 10 MB
  pdf:      50 * 1024 * 1024,  // 50 MB
  audio:    50 * 1024 * 1024,  // 50 MB
  video:   200 * 1024 * 1024,  // 200 MB
  document: 50 * 1024 * 1024,  // 50 MB
  ppt:      50 * 1024 * 1024,  // 50 MB
}

const ALLOWED_MIME: Record<string, string[]> = {
  image:    ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  pdf:      ['application/pdf'],
  audio:    ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'],
  video:    ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ppt:      ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const blockType = (formData.get('blockType') as string | null)?.toLowerCase() ?? 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate MIME type
    const allowed = ALLOWED_MIME[blockType]
    if (allowed && !allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type "${file.type}" for ${blockType}` },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = MAX_SIZES[blockType] ?? 10 * 1024 * 1024
    if (file.size > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024)
      return NextResponse.json({ error: `File too large. Max size for ${blockType}: ${mb} MB` }, { status: 400 })
    }

    // Sanitize filename
    const ext  = file.name.split('.').pop() ?? 'bin'
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
    const path = `uploads/${blockType}/${Date.now()}_${safe}`

    const blob = await put(path, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ success: true, url: blob.url, name: file.name, size: file.size })
  } catch (error: any) {
    console.error('Upload error:', error)
    // If BLOB_READ_WRITE_TOKEN is not set
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        { error: 'File upload is not configured. Please add BLOB_READ_WRITE_TOKEN to your environment variables.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
