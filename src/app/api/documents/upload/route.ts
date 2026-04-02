import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, schoolId: true },
    })
    if (!user || !['ADMIN', 'VICE_PRINCIPAL'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file        = formData.get('file') as File | null
    const title       = formData.get('title') as string
    const description = formData.get('description') as string | null
    const category    = formData.get('category') as string

    if (!file || !title?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'Dosya, başlık ve kategori zorunludur' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const blob = await put(`documents/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    })

    const doc = await prisma.schoolDocument.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        fileUrl: blob.url,
        fileType: ext,
        category,
        uploadedBy: user.id,
        schoolId: user.schoolId,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    console.error('POST /api/documents/upload error:', err)
    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 500 })
  }
}
