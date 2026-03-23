'use client'

import { useEffect, useState } from 'react'
import SocialMediaNav from '@/components/SocialMediaNav'

const PLATFORMS = [
  { id: 'INSTAGRAM', icon: '📸', name: 'Instagram',  color: 'from-pink-500 to-orange-400',   desc: 'Share photos, reels, and stories'   },
  { id: 'TWITTER',   icon: '🐦', name: 'Twitter/X',  color: 'from-sky-400 to-sky-600',        desc: 'Short-form text and multimedia'     },
  { id: 'FACEBOOK',  icon: '👤', name: 'Facebook',   color: 'from-blue-600 to-blue-800',      desc: 'Reach your community on Facebook'   },
  { id: 'LINKEDIN',  icon: '💼', name: 'LinkedIn',   color: 'from-indigo-600 to-indigo-800',  desc: 'Professional network and updates'   },
  { id: 'YOUTUBE',   icon: '▶️', name: 'YouTube',    color: 'from-red-500 to-red-700',        desc: 'Video content and playlists'        },
  { id: 'TIKTOK',    icon: '🎵', name: 'TikTok',     color: 'from-gray-800 to-gray-900',      desc: 'Short-form video for younger audiences' },
]

interface BrandHandles {
  instagramHandle: string
  twitterHandle: string
  facebookPage: string
  linkedinPage: string
  youtubeChannel: string
  tiktokHandle: string
}

const HANDLE_KEYS: Record<string, keyof BrandHandles> = {
  INSTAGRAM: 'instagramHandle',
  TWITTER:   'twitterHandle',
  FACEBOOK:  'facebookPage',
  LINKEDIN:  'linkedinPage',
  YOUTUBE:   'youtubeChannel',
  TIKTOK:    'tiktokHandle',
}

export default function AccountsPage() {
  const [handles, setHandles] = useState<BrandHandles>({
    instagramHandle: '', twitterHandle: '', facebookPage: '',
    linkedinPage: '', youtubeChannel: '', tiktokHandle: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    fetch('/api/social-media/brand')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.brand) {
          setHandles({
            instagramHandle: d.brand.instagramHandle ?? '',
            twitterHandle:   d.brand.twitterHandle   ?? '',
            facebookPage:    d.brand.facebookPage     ?? '',
            linkedinPage:    d.brand.linkedinPage     ?? '',
            youtubeChannel:  d.brand.youtubeChannel   ?? '',
            tiktokHandle:    d.brand.tiktokHandle     ?? '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/social-media/brand', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handles),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><SocialMediaNav />
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Connected Accounts</h2>
            <p className="text-gray-500 text-sm">Manage your social media profile links</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-4">
          {PLATFORMS.map(platform => {
            const key    = HANDLE_KEYS[platform.id]
            const value  = handles[key]
            const linked = !!value

            return (
              <div key={platform.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${linked ? 'border-green-200' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center text-white text-xl shrink-0`}>
                    {platform.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{platform.name}</p>
                      {linked && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Connected</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{platform.desc}</p>
                    <input
                      className="input-field text-sm"
                      placeholder={`Enter your ${platform.name} handle or page URL`}
                      value={value}
                      onChange={e => setHandles(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Note:</span> Direct platform API integration (auto-publishing) requires OAuth tokens for each platform. These handles are used for reference and calendar planning.
          </p>
        </div>
      </div>
    </div>
  )
}
