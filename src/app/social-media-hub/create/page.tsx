'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SocialMediaNav from '@/components/SocialMediaNav'

const PLATFORMS = [
  { id: 'INSTAGRAM', icon: '📸', label: 'Instagram', color: 'border-pink-300 bg-pink-50 text-pink-700'    },
  { id: 'TWITTER',   icon: '🐦', label: 'Twitter/X', color: 'border-sky-300 bg-sky-50 text-sky-700'       },
  { id: 'FACEBOOK',  icon: '👤', label: 'Facebook',  color: 'border-blue-300 bg-blue-50 text-blue-700'    },
  { id: 'LINKEDIN',  icon: '💼', label: 'LinkedIn',  color: 'border-indigo-300 bg-indigo-50 text-indigo-700'},
  { id: 'YOUTUBE',   icon: '▶️', label: 'YouTube',   color: 'border-red-300 bg-red-50 text-red-700'       },
  { id: 'TIKTOK',    icon: '🎵', label: 'TikTok',    color: 'border-gray-300 bg-gray-50 text-gray-700'    },
]

export default function CreatePostPage() {
  const router = useRouter()

  const [title, setTitle]             = useState('')
  const [content, setContent]         = useState('')
  const [platforms, setPlatforms]     = useState<string[]>([])
  const [status, setStatus]           = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>('DRAFT')
  const [scheduledFor, setScheduledFor] = useState('')
  const [tags, setTags]               = useState('')
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const togglePlatform = (id: string) => {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const charLimit = platforms.includes('TWITTER') ? 280 : 2200

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (platforms.length === 0) { setError('Select at least one platform'); return }
    if (!content.trim()) { setError('Content is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/social-media/posts', {
        method: 'POST',
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
        setError(data.error || 'Failed to save post')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Post</h2>
          <p className="text-gray-500 text-sm">Draft a new social media post</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Platform selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Platforms <span className="text-red-400">*</span></h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PLATFORMS.map(p => {
                const selected = platforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
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

          {/* Content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                className="input-field"
                placeholder="e.g. Back to school announcement"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">Caption / Content <span className="text-red-400">*</span></label>
                <span className={`text-xs ${content.length > charLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {content.length}/{charLimit}
                </span>
              </div>
              <textarea
                className="input-field resize-none"
                rows={7}
                placeholder="Write your post caption here…"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              {platforms.includes('TWITTER') && content.length > 280 && (
                <p className="text-xs text-red-500 mt-1">Twitter limit is 280 characters</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tags / Hashtags <span className="text-gray-400 font-normal">(comma separated)</span></label>
              <input
                className="input-field"
                placeholder="#education, #school, #learning"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Internal Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Notes for yourself or your team"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Status & Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Publishing</h3>
            <div className="flex flex-wrap gap-2">
              {(['DRAFT', 'SCHEDULED', 'PUBLISHED'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    status === s
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s === 'DRAFT' ? '📝 Save as Draft' : s === 'SCHEDULED' ? '📅 Schedule' : '🚀 Publish Now'}
                </button>
              ))}
            </div>
            {status === 'SCHEDULED' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving…' : status === 'DRAFT' ? 'Save Draft' : status === 'SCHEDULED' ? 'Schedule Post' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
