'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import SocialMediaNav from '@/components/SocialMediaNav'

interface Stats {
  totalPosts: number
  published: number
  scheduled: number
  drafts: number
}

interface RecentPost {
  id: string
  title: string | null
  content: string
  platforms: string[]
  status: string
  scheduledFor: string | null
  publishedAt: string | null
  createdAt: string
}

const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: '📸', TWITTER: '🐦', FACEBOOK: '👤',
  LINKEDIN: '💼', YOUTUBE: '▶️', TIKTOK: '🎵',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED:  'bg-yellow-100 text-yellow-700',
}

export default function SocialDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const [stats, setStats]       = useState<Stats>({ totalPosts: 0, published: 0, scheduled: 0, drafts: 0 })
  const [recent, setRecent]     = useState<RecentPost[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/social-media/posts?limit=5').then(r => r.json()),
    ]).then(([postsData]) => {
      if (postsData.success) {
        const posts: RecentPost[] = postsData.posts
        setRecent(posts)
        setStats({
          totalPosts: postsData.total ?? posts.length,
          published:  posts.filter(p => p.status === 'PUBLISHED').length,
          scheduled:  posts.filter(p => p.status === 'SCHEDULED').length,
          drafts:     posts.filter(p => p.status === 'DRAFT').length,
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Posts',  value: stats.totalPosts, icon: '📄', color: 'from-pink-500 to-rose-500',    bg: 'bg-pink-50'   },
    { label: 'Published',    value: stats.published,  icon: '✅', color: 'from-green-500 to-emerald-500', bg: 'bg-green-50'  },
    { label: 'Scheduled',    value: stats.scheduled,  icon: '📅', color: 'from-blue-500 to-indigo-500',   bg: 'bg-blue-50'   },
    { label: 'Drafts',       value: stats.drafts,     icon: '✏️', color: 'from-gray-400 to-gray-500',     bg: 'bg-gray-50'   },
  ]

  const quickActions = [
    { label: 'Create Post',     icon: '✏️', href: '/social-media-hub/create',          color: 'from-pink-500 to-purple-600'    },
    { label: 'Content Calendar',icon: '📅', href: '/social-media-hub/calendar',         color: 'from-blue-500 to-indigo-600'    },
    { label: 'Content Library', icon: '🗂️', href: '/social-media-hub/content-library',  color: 'from-amber-500 to-orange-600'   },
    { label: 'Brand Settings',  icon: '🎨', href: '/social-media-hub/brand',            color: 'from-emerald-500 to-teal-600'   },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            Welcome back, {session?.user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-500">Here's your social media overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(a => (
                <button
                  key={a.href}
                  onClick={() => router.push(a.href)}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${a.color} rounded-xl flex items-center justify-center mb-3 text-white text-lg group-hover:scale-110 transition-transform`}>
                    {a.icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{a.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Recent Posts</h3>
              <button onClick={() => router.push('/social-media-hub/posts')} className="text-sm text-pink-600 font-medium hover:text-pink-800">
                View all →
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
              </div>
            ) : recent.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="text-5xl mb-3">📱</div>
                <p className="text-gray-600 font-medium mb-4">No posts yet</p>
                <button onClick={() => router.push('/social-media-hub/create')} className="btn-primary text-sm">
                  Create your first post
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map(post => (
                  <div
                    key={post.id}
                    onClick={() => router.push(`/social-media-hub/posts/${post.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-pink-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {post.title && <p className="text-sm font-semibold text-gray-900 mb-0.5 truncate">{post.title}</p>}
                        <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex gap-1">
                            {post.platforms.map(p => (
                              <span key={p} className="text-base" title={p}>{PLATFORM_ICONS[p] ?? '📱'}</span>
                            ))}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {post.status.charAt(0) + post.status.slice(1).toLowerCase()}
                          </span>
                          {post.scheduledFor && (
                            <span className="text-xs text-gray-400">
                              {new Date(post.scheduledFor).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
