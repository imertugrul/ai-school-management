'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import SocialMediaNav from '@/components/SocialMediaNav'

const PLATFORMS = [
  { id: 'INSTAGRAM', icon: '📸', label: 'Instagram', color: 'border-pink-300 bg-pink-50 text-pink-700'     },
  { id: 'TWITTER',   icon: '🐦', label: 'Twitter/X', color: 'border-sky-300 bg-sky-50 text-sky-700'        },
  { id: 'FACEBOOK',  icon: '👤', label: 'Facebook',  color: 'border-blue-300 bg-blue-50 text-blue-700'     },
  { id: 'LINKEDIN',  icon: '💼', label: 'LinkedIn',  color: 'border-indigo-300 bg-indigo-50 text-indigo-700'},
  { id: 'YOUTUBE',   icon: '▶️', label: 'YouTube',   color: 'border-red-300 bg-red-50 text-red-700'        },
  { id: 'TIKTOK',    icon: '🎵', label: 'TikTok',    color: 'border-gray-300 bg-gray-50 text-gray-700'     },
]

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [loading, setLoading]         = useState(true)
  const [title, setTitle]             = useState('')
  const [content, setContent]         = useState('')
  const [platforms, setPlatforms]     = useState<string[]>([])
  const [status, setStatus]           = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>('DRAFT')
  const [scheduledFor, setScheduledFor] = useState('')
  const [tags, setTags]               = useState('')
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    fetch(`/api/social-media/posts/${postId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const p = data.post
          setTitle(p.title ?? '')
          setContent(p.content)
          setPlatforms(p.platforms)
          setStatus(p.status)
          setScheduledFor(p.scheduledFor ? new Date(p.scheduledFor).toISOString().slice(0, 16) : '')
          setTags(p.tags.join(', '))
          setNotes(p.notes ?? '')
        }
        setLoading(false)
      })
  }, [postId])

  const togglePlatform = (id: string) =>
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (platforms.length === 0) { setError('Select at least one platform'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/social-media/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          content,
          platforms,
          status,
          scheduledFor: status === 'SCHEDULED' && scheduledFor ? scheduledFor : undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/social-media-hub/posts')
      } else {
        setError(data.error || 'Failed to update post')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Post</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Platforms</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PLATFORMS.map(p => {
                const selected = platforms.includes(p.id)
                return (
                  <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      selected ? p.color + ' border-current' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-xs font-medium">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title (optional)</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
              <textarea className="input-field resize-none" rows={7} value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tags (comma separated)</label>
              <input className="input-field" value={tags} onChange={e => setTags(e.target.value)} placeholder="#education, #school" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Internal Notes</label>
              <textarea className="input-field resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Publishing</h3>
            <div className="flex flex-wrap gap-2">
              {(['DRAFT', 'SCHEDULED', 'PUBLISHED'] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    status === s ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s === 'DRAFT' ? '📝 Draft' : s === 'SCHEDULED' ? '📅 Scheduled' : '🚀 Published'}
                </button>
              ))}
            </div>
            {status === 'SCHEDULED' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule Date & Time</label>
                <input type="datetime-local" className="input-field" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving…' : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
