import type { Metadata } from 'next'
import FeatureClient from './FeatureClient'

/* ─── Per-module metadata (TR/EN/DE) ─────────────────────────────────────── */

const META: Record<string, { title: string; description: string }> = {
  teacher: {
    title: 'Öğretmen Paneli — AI Ders Planı ve Otomatik Puanlama',
    description:
      'Haftada 10+ saat tasarruf edin. AI ile ders planı oluşturun, 18 farklı soru tipiyle test yapın, otomatik puanlayın.',
  },
  student: {
    title: 'Öğrenci Paneli — Not Takibi ve Sınav Sonuçları',
    description:
      'Tüm derslerinizdeki notları anlık takip edin. Ağırlıklı ortalama, GPA, AI geri bildirimi ve devamsızlık geçmişi tek ekranda.',
  },
  parent: {
    title: 'Veli Portalı — Anlık Not ve Devamsızlık Bildirimleri',
    description:
      'Çocuğunuzun notlarını ve devamsızlıklarını anlık takip edin. WhatsApp ve email bildirimleri, aylık performans bülteni.',
  },
  'ai-planner': {
    title: 'AI Ders Planı — 2 Dakikada Profesyonel Plan',
    description:
      '2 saatlik ders planını 2 dakikaya indirin. IB, AP, MEB, IGCSE müfredatlarına uygun AI destekli ders planı sistemi.',
  },
  'test-system': {
    title: '18 Soru Tipiyle Test Sistemi — SchoolPro AI',
    description:
      'Çoktan seçmeli, açık uçlu, eşleştirme, sürükle-bırak ve 14 farklı soru tipi daha. AI otomatik puanlar.',
  },
  gradebook: {
    title: 'Not Defteri — Ağırlıklı Ortalama ve Otomatik Hesaplama',
    description:
      'Excel benzeri not giriş ekranı. Ağırlıklı bileşenler, otomatik GPA hesaplama, renk kodlu görünüm.',
  },
  attendance: {
    title: 'Devamsızlık Yönetimi — Akıllı Takip ve Anında Bildirim',
    description:
      'Hızlı yoklama, müdür onay sistemi, WhatsApp ve email bildirim. Kronik devamsızlık tespiti ve aylık raporlama.',
  },
  analytics: {
    title: 'Analitik Dashboard — Veriye Dayalı Okul Yönetimi',
    description:
      'Okul geneli KPI takibi, risk öğrenci tespiti, öğretmen etkinlik analizi. PDF ve Excel export.',
  },
  communication: {
    title: 'İletişim Sistemi — WhatsApp ve Email Bildirimleri',
    description:
      'Devamsızlık ve not bildirimleri WhatsApp ile anlık iletilir. Aylık performans bülteni otomatik gönderilir. KVKK uyumlu.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: { module: string }
}): Promise<Metadata> {
  const meta = META[params.module] ?? {
    title: 'Özellik — SchoolPro AI',
    description: 'SchoolPro AI okul yönetim sistemi özellikleri.',
  }

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://www.schoolproai.com/features/${params.module}`,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: `/features/${params.module}`,
    },
  }
}

export default function FeaturePage({ params }: { params: { module: string } }) {
  return <FeatureClient module={params.module} />
}
