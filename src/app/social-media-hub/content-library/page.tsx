'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SocialMediaNav from '@/components/SocialMediaNav'

interface LibraryItem {
  id: string
  name: string
  url: string
  type: string   // image/video/document/audio
  size: number
  tags: string[]
  createdAt: string
}

// We'll store content library items as SocialPosts with status=ARCHIVED and special tags
// Actually, simpler: use localStorage for demo, but real impl would use Vercel Blob list
// For now let's store them via a dedicated API route that wraps blob storage

export default function ContentLibraryPage() {
  const router   = useRouter()
  const [items, setItems]       = useState<LibraryItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchItems = async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search)     p.set('search', search)
    if (typeFilter) p.set('type', typeFilter)
    const res  = await fetch(`/api/social-media/library?${p}`)
    const data = await res.json()
    if (data.success) setItems(data.items)
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [search, typeFilter])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('blockType', file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'document')
    try {
      const uploadRes  = await fetch('/api/upload', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (uploadData.success) {
        // Save to library
        await fetch('/api/social-media/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            url:  uploadData.url,
            type: file.type.split('/')[0],
            size: file.size,
          }),
        })
        await fetchItems()
      }
    } catch { /* silent */ }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from your library?')) return
    await fetch(`/api/social-media/library/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  }

  const TYPE_ICONS: Record<string, string> = { image: '🖼️', video: '🎬', audio: '🎵', document: '📄', application: '📄' }

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content Library</h2>
            <p className="text-gray-500 text-sm">Store and reuse media assets</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : '+ Upload File'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            className="input-field flex-1 min-w-48"
            placeholder="🔍 Search files…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input-field w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
            <div className="text-5xl mb-4">🗂️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Library is empty</h3>
            <p className="text-gray-500 text-sm mb-6">Upload images, videos, and documents to reuse in your posts.</p>
            <button onClick={() => fileRef.current?.click()} className="btn-primary">Upload File</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map(item => (
              <div key={item.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-pink-200 hover:shadow-md transition-all">
                {/* Preview */}
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{TYPE_ICONS[item.type] ?? '📄'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-800 truncate" title={item.name}>{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatSize(item.size)}</p>
                </div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a href={item.url} target="_blank" rel="noreferrer"
                    className="bg-white text-gray-900 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100">
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
