'use client'

import { useEffect, useRef, useState } from 'react'

interface Doc {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  category: string
  isActive: boolean
  createdAt: string
  uploader: { name: string }
}

const CATEGORIES = ['yonetmelik', 'duyuru', 'form', 'kilavuz', 'diger']
const CATEGORY_LABELS: Record<string, string> = {
  yonetmelik: 'Yönetmelik',
  duyuru:     'Duyuru',
  form:       'Form',
  kilavuz:    'Kılavuz',
  diger:      'Diğer',
}

export default function AdminDocumentsPage() {
  const [docs, setDocs]           = useState<Doc[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'duyuru' })
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setDocs(d) : [])
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !form.title.trim()) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('category', form.category)
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
      if (res.ok) {
        setForm({ title: '', description: '', category: 'duyuru' })
        if (fileRef.current) fileRef.current.value = ''
        setShowForm(false)
        load()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Yükleme başarısız')
      }
    } finally {
      setUploading(false)
    }
  }

  async function toggleActive(doc: Doc) {
    await fetch(`/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !doc.isActive }),
    })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Okul Belgeleri</h1>
          <p className="text-sm text-gray-500 mt-1">Velilerin görebileceği belgeleri yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Belge Ekle
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={handleUpload} className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Yeni Belge Yükle</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Başlık *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Belge başlığı"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Kategori *</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Açıklama</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Kısa açıklama (opsiyonel)"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Dosya * (PDF önerilen)</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg" required
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={uploading}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-6 py-2 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Document list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm">Henüz belge yüklenmemiş.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className={`bg-white border rounded-2xl p-4 shadow-sm flex items-start gap-4 ${!doc.isActive ? 'opacity-60' : ''}`}>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                {doc.fileType === 'pdf' ? '📕' : '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm truncate">{doc.title}</p>
                  {!doc.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Pasif</span>}
                </div>
                {doc.description && <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{CATEGORY_LABELS[doc.category] ?? doc.category}</span>
                  <span className="text-xs text-gray-400">{doc.uploader?.name}</span>
                  <span className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline font-medium">Görüntüle</a>
                <button onClick={() => toggleActive(doc)}
                  className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${doc.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                  {doc.isActive ? 'Pasif Yap' : 'Aktif Et'}
                </button>
                <button onClick={() => handleDelete(doc.id)}
                  className="text-xs text-red-500 hover:bg-red-50 font-medium px-2 py-1 rounded-lg transition-colors">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
