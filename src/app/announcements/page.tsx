'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  category: string
  isPinned: boolean
  publishedAt: string
  expiresAt: string | null
  author: { id: string; name: string; role: string }
  targetClass: { id: string; name: string } | null
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  LOW: 'bg-gray-100 text-gray-600'
}

const CATEGORIES = ['All', 'Academic', 'Sports', 'Events', 'General']

export default function AnnouncementsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const role = (session?.user as { role?: string })?.role
  const backPath =
    role === 'ADMIN' ? '/admin' :
    role === 'TEACHER' ? '/teacher/dashboard' :
    role === 'PARENT' ? '/parent/dashboard' :
    '/student/dashboard'

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(data => {
        if (data.success) setAnnouncements(data.announcements)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = announcements.filter(a => {
    const matchCategory = activeCategory === 'All' || a.category === activeCategory
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(backPath)}
                className="btn-secondary text-sm"
              >
                ← Back
              </button>
              <h1 className="text-lg font-bold text-gray-900">Announcements</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Announcements</h3>
            <p className="text-gray-500">There are no announcements to display right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(a => {
              const isExpanded = expanded.has(a.id)
              const needsTruncate = a.content.length > 200
              const displayContent = isExpanded || !needsTruncate
                ? a.content
                : a.content.slice(0, 200) + '...'

              return (
                <div
                  key={a.id}
                  className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border transition-all duration-300 ${
                    a.isPinned
                      ? 'border-yellow-300 shadow-yellow-100'
                      : 'border-gray-100 hover:shadow-lg'
                  }`}
                >
                  {a.isPinned && (
                    <div className="absolute top-4 right-4 text-yellow-500 text-lg">📌</div>
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.MEDIUM}`}>
                      {a.priority}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {a.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{a.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{displayContent}</p>
                  {needsTruncate && (
                    <button
                      onClick={() => toggleExpand(a.id)}
                      className="text-blue-600 text-sm font-medium mt-2 hover:underline"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <span>By {a.author.name}</span>
                    <span>•</span>
                    <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
                    {a.expiresAt && (
                      <>
                        <span>•</span>
                        <span>Expires {new Date(a.expiresAt).toLocaleDateString()}</span>
                      </>
                    )}
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
