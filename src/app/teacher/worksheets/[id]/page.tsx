'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { WorksheetView, usePdfDownload, type WorksheetContent } from '@/components/WorksheetView'

interface Worksheet {
  id: string
  title: string
  topic: string
  grade: string | null
  curriculum: string | null
  language: string
  types: string[]
  content: WorksheetContent
  createdAt: string
  lessonPlan: {
    id: string
    title: string
    unitName: string | null
    curriculumType: string | null
    course: { code: string; name: string; grade: string | null }
    class: { name: string } | null
  } | null
}

export default function WorksheetDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [worksheet, setWorksheet] = useState<Worksheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { downloading, download } = usePdfDownload()

  useEffect(() => {
    if (!id) return
    fetch(`/api/teacher/worksheets/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setWorksheet(data.worksheet)
        else setError(data.error || 'Worksheet yüklenemedi.')
      })
      .catch(() => setError('Worksheet yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!worksheet) return
    if (!confirm('Bu worksheet\'i silmek istediğinize emin misiniz?')) return
    await fetch(`/api/teacher/worksheets/${worksheet.id}`, { method: 'DELETE' })
    router.push('/teacher/lesson-plans')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !worksheet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-red-600 mb-4">{error || 'Worksheet bulunamadı.'}</p>
        <button onClick={() => router.push('/teacher/lesson-plans')} className="btn-secondary">← Ders Planları</button>
      </div>
    )
  }

  const filename = `${worksheet.title.replace(/[^a-z0-9-_çğıöşüÇĞİÖŞÜ ]/gi, '').slice(0, 60)}-${new Date(worksheet.createdAt).toISOString().slice(0, 10)}.pdf`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow shrink-0">
                <span className="text-white text-lg">📄</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{worksheet.title}</h1>
                <p className="text-xs text-gray-500 truncate">
                  {worksheet.lessonPlan?.course.code}
                  {worksheet.grade && <> · {worksheet.grade}</>}
                  {' · '}{new Date(worksheet.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => download(filename)}
                disabled={downloading}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {downloading ? 'İndiriliyor…' : '📥 PDF İndir'}
              </button>
              <button onClick={() => window.print()} className="btn-secondary text-sm hidden md:inline-flex">🖨️ Yazdır</button>
              <button onClick={handleDelete} className="btn-secondary text-sm text-red-600 hover:text-red-700">🗑️</button>
              <button onClick={() => router.push('/teacher/lesson-plans')} className="text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">←</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <WorksheetView
          meta={{
            title: worksheet.title,
            topic: worksheet.topic,
            courseCode: worksheet.lessonPlan?.course.code ?? null,
            courseName: worksheet.lessonPlan?.course.name ?? null,
            grade: worksheet.grade,
            curriculum: worksheet.curriculum,
            language: worksheet.language,
            className: worksheet.lessonPlan?.class?.name ?? null,
            createdAt: worksheet.createdAt,
          }}
          content={worksheet.content}
        />
      </div>
    </div>
  )
}
