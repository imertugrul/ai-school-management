'use client'

import { useEffect, useState } from 'react'

interface Doc {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  category: string
  createdAt: string
  uploader: { name: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  yonetmelik: '⚖️ Yönetmelik',
  duyuru:     '📢 Duyuru',
  form:       '📝 Form',
  kilavuz:    '📖 Kılavuz',
  diger:      '📎 Diğer',
}

const CATEGORIES = ['tümü', 'yonetmelik', 'duyuru', 'form', 'kilavuz', 'diger']

export default function ParentDocumentsPage() {
  const [docs, setDocs]         = useState<Doc[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('tümü')

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setDocs(d) : [])
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'tümü' ? docs : docs.filter(d => d.category === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Okul Belgeleri</h1>
        <p className="text-sm text-gray-500 mt-0.5">Yönetmelikler, formlar ve duyurular</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === cat
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {cat === 'tümü' ? '📂 Tümü' : (CATEGORY_LABELS[cat] ?? cat)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm">Bu kategoride belge bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                  {doc.fileType === 'pdf' ? '📕' : '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{doc.title}</p>
                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[doc.category] ?? doc.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs font-medium text-blue-600 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Görüntüle →
                </a>
                <a
                  href={doc.fileUrl}
                  download
                  className="flex-1 text-center text-xs font-medium text-gray-600 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İndir ↓
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
