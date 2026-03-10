import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { questionId, response } = await request.json()

    // Mevcut cevap var mı kontrol et
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        submissionId_questionId: {
          submissionId: params.id,
          questionId
        }
      }
    })

    if (existingAnswer) {
      // Güncelle
      await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: { response }
      })
    } else {
      // Yeni oluştur
      await prisma.answer.create({
        data: {
          submissionId: params.id,
          questionId,
          response
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save answer error:', error)
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }
}
