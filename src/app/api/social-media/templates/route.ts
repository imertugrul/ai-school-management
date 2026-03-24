import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const TEMPLATES = [
  {
    id: 'achievement',
    category: 'Başarı & Ödül',
    icon: '🏆',
    title: 'Öğrenci Başarı Paylaşımı',
    exampleTopic: 'Matematik olimpiyatında birinci olduk',
    suggestedPlatforms: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN'],
    estimatedEngagement: 'Yüksek',
  },
  {
    id: 'new-term',
    category: 'Dönem',
    icon: '📅',
    title: 'Yeni Dönem Başlıyor',
    exampleTopic: 'Yeni öğretim yılına hoş geldiniz',
    suggestedPlatforms: ['INSTAGRAM', 'FACEBOOK', 'TWITTER'],
    estimatedEngagement: 'Orta',
  },
  {
    id: 'teachers-day',
    category: 'Özel Gün',
    icon: '📚',
    title: 'Öğretmenler Günü',
    exampleTopic: '24 Kasım Öğretmenler Günü kutlama mesajı',
    suggestedPlatforms: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN'],
    estimatedEngagement: 'Çok Yüksek',
  },
  {
    id: 'graduation',
    category: 'Mezuniyet',
    icon: '🎓',
    title: 'Mezuniyet Töreni',
    exampleTopic: 'Mezuniyet törenimiz gerçekleşti',
    suggestedPlatforms: ['INSTAGRAM', 'FACEBOOK', 'YOUTUBE'],
    estimatedEngagement: 'Çok Yüksek',
  },
  {
    id: 'enrollment',
    category: 'Kayıt',
    icon: '📊',
    title: 'Kayıt Dönemi',
    exampleTopic: '2025-2026 kayıt dönemi başladı',
    suggestedPlatforms: ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'],
    estimatedEngagement: 'Yüksek',
  },
  {
    id: 'event',
    category: 'Etkinlik',
    icon: '🤝',
    title: 'Etkinlik Duyurusu',
    exampleTopic: 'Bilim fuarımız bu hafta sonu',
    suggestedPlatforms: ['INSTAGRAM', 'FACEBOOK', 'TWITTER'],
    estimatedEngagement: 'Orta',
  },
  {
    id: 'spotlight',
    category: 'Öğrenci',
    icon: '🌟',
    title: 'Öğrenci Spotlight',
    exampleTopic: 'Bu ay öne çıkan öğrencilerimiz',
    suggestedPlatforms: ['INSTAGRAM', 'FACEBOOK'],
    estimatedEngagement: 'Yüksek',
  },
]

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({ success: true, templates: TEMPLATES })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('GET /api/social-media/templates error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
