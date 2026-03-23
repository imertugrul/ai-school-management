'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SocialMediaNav from '@/components/SocialMediaNav'

interface Post {
  id: string
  title: string | null
  content: string
  platforms: string[]
  status: string
  scheduledFor: string | null
  publishedAt: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: '📸', TWITTER: '🐦', FACEBOOK: '👤',
  LINKEDIN: '💼', YOUTUBE: '▶️', TIKTOK: '🎵',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600'   },
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700'   },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-700' },
  ARCHIVED:  { label: 'Archived',  color: 'bg-yellow-100 text-yellow-700'},
}

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts]           = useState<Post[]>([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]         = useState('')
  const [deleting, setDeleting]     = useState<string | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    if (search)       p.set('search', search)
    const res  = await fetch(`/api/social-media/posts?${p}`)
    const data = await res.json()
    if (data.success) setPosts(data.posts)
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [statusFilter, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    setDeleting(id)
    await fetch(`/api/social-media/posts/${id}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Posts</h2>
            <p className="text-gray-500 text-sm">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => router.push('/social-media-hub/create')} className="btn-primary text-sm">
            + New Post
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            className="input-field flex-1 min-w-48"
            placeholder="🔍 Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter('') }} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gray-100">
              ✕ Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500 text-sm mb-6">
              {search || statusFilter ? 'Try adjusting your filters.' : 'Start creating posts to engage your audience.'}
            </p>
            <button onClick={() => router.push('/social-media-hub/create')} className="btn-primary">
              Create Post
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => {
              const s = STATUS_LABELS[post.status] ?? STATUS_LABELS.DRAFT
              return (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-pink-200 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {post.title && (
                        <p className="text-sm font-bold text-gray-900 mb-1">{post.title}</p>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-line">{post.content}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <div className="flex gap-1">
                          {post.platforms.map(pl => (
                            <span key={pl} className="text-base" title={pl}>{PLATFORM_ICONS[pl] ?? '📱'}</span>
                          ))}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                        {post.scheduledFor && (
                          <span className="text-xs text-gray-400">
                            📅 {new Date(post.scheduledFor).toLocaleString()}
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="text-xs text-gray-400">
                            ✅ {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.map(t => (
                            <span key={t} className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => router.push(`/social-media-hub/posts/${post.id}/edit`)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className="text-xs px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {deleting === post.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
