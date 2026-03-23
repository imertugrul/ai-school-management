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
}

const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: '📸', TWITTER: '🐦', FACEBOOK: '👤',
  LINKEDIN: '💼', YOUTUBE: '▶️', TIKTOK: '🎵',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-gray-200',
  SCHEDULED: 'bg-blue-200 text-blue-900',
  PUBLISHED: 'bg-green-200 text-green-900',
  ARCHIVED:  'bg-yellow-200 text-yellow-900',
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun → adjust to Mon=0
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export default function CalendarPage() {
  const router = useRouter()
  const now    = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const from = new Date(year, month, 1).toISOString()
    const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    setLoading(true)
    fetch(`/api/social-media/posts?from=${from}&to=${to}&limit=200`)
      .then(r => r.json())
      .then(d => { if (d.success) setPosts(d.posts); setLoading(false) })
      .catch(() => setLoading(false))
  }, [year, month])

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const daysInMonth  = getDaysInMonth(year, month)
  const firstDay     = getFirstDayOfMonth(year, month)
  const totalCells   = firstDay + daysInMonth
  const rows         = Math.ceil(totalCells / 7)

  const postsByDay: Record<number, Post[]> = {}
  posts.forEach(p => {
    const date = p.scheduledFor ? new Date(p.scheduledFor) : p.publishedAt ? new Date(p.publishedAt) : null
    if (date && date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate()
      if (!postsByDay[day]) postsByDay[day] = []
      postsByDay[day].push(p)
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
            <p className="text-gray-500 text-sm">Plan and track your posts</p>
          </div>
          <button onClick={() => router.push('/social-media-hub/create')} className="btn-primary text-sm">
            + Schedule Post
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">←</button>
          <h3 className="text-lg font-bold text-gray-900 w-48 text-center">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">→</button>
          <button
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()) }}
            className="text-sm text-pink-600 font-medium hover:text-pink-800 ml-2"
          >
            Today
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map(d => (
              <div key={d} className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {Array.from({ length: rows * 7 }, (_, i) => {
                const dayNum = i - firstDay + 1
                const isValid = dayNum >= 1 && dayNum <= daysInMonth
                const isToday = isValid && year === now.getFullYear() && month === now.getMonth() && dayNum === now.getDate()
                const dayPosts = isValid ? (postsByDay[dayNum] ?? []) : []

                return (
                  <div
                    key={i}
                    className={`min-h-24 p-2 border-b border-r border-gray-100 ${isValid ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    {isValid && (
                      <>
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                          isToday ? 'bg-pink-600 text-white' : 'text-gray-700'
                        }`}>
                          {dayNum}
                        </div>
                        <div className="space-y-0.5">
                          {dayPosts.slice(0, 3).map(p => (
                            <button
                              key={p.id}
                              onClick={() => router.push(`/social-media-hub/posts/${p.id}/edit`)}
                              className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100'}`}
                              title={p.title ?? p.content}
                            >
                              {p.platforms.slice(0, 1).map(pl => PLATFORM_ICONS[pl] ?? '📱').join('')} {p.title ?? p.content.slice(0, 20)}
                            </button>
                          ))}
                          {dayPosts.length > 3 && (
                            <p className="text-xs text-gray-400 px-1">+{dayPosts.length - 3} more</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className={`w-3 h-3 rounded ${c}`} />
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
