'use client'

import { useEffect, useState } from 'react'

interface Announcement {
  id: string; title: string; content: string
  publishedAt: string; isPinned: boolean; priority: string
  author: { name: string }
  category: string
}

const PRIORITY_BADGE: Record<string, string> = {
  HIGH:   'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW:    'bg-gray-100 text-gray-500',
}

export default function ParentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(d => {
        const all: Announcement[] = d.announcements ?? []
        // Filter: targetRoles empty or includes PARENT
        const filtered = all.filter(a => {
          const roles = (a as unknown as { targetRoles: string[] }).targetRoles ?? []
          return roles.length === 0 || roles.includes('PARENT')
        })
        setAnnouncements(filtered)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Duyurular</h1>
        <p className="text-sm text-gray-400">Okul duyuruları</p>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📢</div>
          <p className="text-gray-500 text-sm">Henüz duyuru yok.</p>
        </div>
      ) : (
        announcements.map(ann => (
          <div key={ann.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              {ann.isPinned && <span className="text-base shrink-0 mt-0.5">📌</span>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">{ann.title}</h3>
                  {ann.priority !== 'LOW' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[ann.priority] ?? PRIORITY_BADGE.LOW}`}>
                      {ann.priority === 'HIGH' ? 'Önemli' : 'Orta'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-400">
                    {new Date(ann.publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <span className="text-gray-300">·</span>
                  <p className="text-xs text-gray-400">{ann.author.name}</p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
