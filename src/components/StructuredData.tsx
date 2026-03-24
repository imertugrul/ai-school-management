/* Structured data (JSON-LD) for SEO rich snippets */

const softwareApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SchoolPro AI',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  description: 'AI destekli okul yönetim sistemi. Ders planı oluşturma, otomatik puanlama, veli bildirimi.',
  url: 'https://ai-school-management-omega.vercel.app',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TRY',
    description: 'Ücretsiz başlangıç planı — 50 öğrenciye kadar',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '50',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Verilerimiz güvende mi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Evet. Tüm veriler KVKK ve GDPR standartlarına uygun işlenir. Öğrenci kişisel bilgileri AI sistemlerine gönderilmez.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kaç öğretmen kullanabilir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tüm planlarda öğretmen sayısı sınırsızdır. Yalnızca aktif öğrenci sayısı ücretlendirmeyi etkiler.',
      },
    },
    {
      '@type': 'Question',
      name: 'Mevcut sistemden geçiş nasıl olur?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CSV import özelliğimiz ile verilerinizi dakikalar içinde aktarabilirsiniz. Ücretsiz onboarding desteği sunuyoruz.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hangi müfredatları destekliyorsunuz?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'IB, AP, MEB (Türk Milli Eğitim), IGCSE ve Common Core desteklenmektedir.',
      },
    },
    {
      '@type': 'Question',
      name: 'Mobil uygulamanız var mı?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Web uygulamamız tüm cihazlarda responsive çalışır. Native uygulamamız 2026 Q3'te yayına girecektir.",
      },
    },
  ],
}

export default function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
