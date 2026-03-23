'use client'

import { useEffect, useState } from 'react'
import SocialMediaNav from '@/components/SocialMediaNav'

interface BrandData {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl: string
  coverUrl: string
  organizationName: string
  tagline: string
  voiceTone: string
  hashtags: string[]
  forbiddenWords: string[]
  instagramHandle: string
  twitterHandle: string
  facebookPage: string
  linkedinPage: string
  youtubeChannel: string
  tiktokHandle: string
}

const DEFAULT: BrandData = {
  primaryColor: '#3B82F6', secondaryColor: '#8B5CF6', accentColor: '#10B981',
  logoUrl: '', coverUrl: '', organizationName: '', tagline: '',
  voiceTone: 'PROFESSIONAL',
  hashtags: [], forbiddenWords: [],
  instagramHandle: '', twitterHandle: '', facebookPage: '',
  linkedinPage: '', youtubeChannel: '', tiktokHandle: '',
}

const VOICE_TONES = [
  { id: 'PROFESSIONAL', label: 'Professional', desc: 'Formal and authoritative'   },
  { id: 'CASUAL',       label: 'Casual',       desc: 'Friendly and approachable'  },
  { id: 'EDUCATIONAL',  label: 'Educational',  desc: 'Informative and instructive' },
  { id: 'INSPIRATIONAL',label: 'Inspirational',desc: 'Motivational and uplifting' },
]

export default function BrandPage() {
  const [brand, setBrand]   = useState<BrandData>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [hashtagInput, setHashtagInput] = useState('')
  const [forbiddenInput, setForbiddenInput] = useState('')

  useEffect(() => {
    fetch('/api/social-media/brand')
      .then(r => r.json())
      .then(d => { if (d.success && d.brand) setBrand({ ...DEFAULT, ...d.brand }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const set = (field: keyof BrandData, value: any) => setBrand(prev => ({ ...prev, [field]: value }))

  const addHashtag = () => {
    const t = hashtagInput.trim().replace(/^#/, '')
    if (t && !brand.hashtags.includes(t)) { set('hashtags', [...brand.hashtags, t]); setHashtagInput('') }
  }

  const addForbidden = () => {
    const t = forbiddenInput.trim()
    if (t && !brand.forbiddenWords.includes(t)) { set('forbiddenWords', [...brand.forbiddenWords, t]); setForbiddenInput('') }
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/social-media/brand', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    })
    setSaving(false)
    setSaved(true)
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
            <h2 className="text-2xl font-bold text-gray-900">Brand Settings</h2>
            <p className="text-gray-500 text-sm">Define your organization's visual identity and voice</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">

          {/* Identity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Identity</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Organization Name</label>
              <input className="input-field" value={brand.organizationName} onChange={e => set('organizationName', e.target.value)} placeholder="e.g. Riverside Academy" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline</label>
              <input className="input-field" value={brand.tagline} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Inspiring minds, shaping futures" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Logo URL</label>
                <input className="input-field" value={brand.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Image URL</label>
                <input className="input-field" value={brand.coverUrl} onChange={e => set('coverUrl', e.target.value)} placeholder="https://…" />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Brand Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'primaryColor',   label: 'Primary'   },
                { key: 'secondaryColor', label: 'Secondary' },
                { key: 'accentColor',    label: 'Accent'    },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(brand as any)[key]}
                      onChange={e => set(key as keyof BrandData, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      className="input-field flex-1 font-mono text-sm"
                      value={(brand as any)[key]}
                      onChange={e => set(key as keyof BrandData, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Tone */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Voice & Tone</h3>
            <div className="grid grid-cols-2 gap-3">
              {VOICE_TONES.map(vt => (
                <button
                  key={vt.id}
                  type="button"
                  onClick={() => set('voiceTone', vt.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    brand.voiceTone === vt.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-semibold ${brand.voiceTone === vt.id ? 'text-pink-700' : 'text-gray-900'}`}>{vt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{vt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Brand Hashtags</h3>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="education"
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
              />
              <button onClick={addHashtag} className="btn-secondary">Add</button>
            </div>
            {brand.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brand.hashtags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-3 py-1 rounded-full font-medium">
                    #{t}
                    <button onClick={() => set('hashtags', brand.hashtags.filter(h => h !== t))} className="ml-1 text-pink-400 hover:text-pink-700">✕</button>
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Forbidden Words</label>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="words to avoid…"
                  value={forbiddenInput}
                  onChange={e => setForbiddenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addForbidden())}
                />
                <button onClick={addForbidden} className="btn-secondary">Add</button>
              </div>
              {brand.forbiddenWords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {brand.forbiddenWords.map(w => (
                    <span key={w} className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium">
                      {w}
                      <button onClick={() => set('forbiddenWords', brand.forbiddenWords.filter(x => x !== w))} className="ml-1 text-red-400 hover:text-red-700">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Social Handles */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Social Handles</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'instagramHandle', icon: '📸', placeholder: '@yourschool'    },
                { key: 'twitterHandle',   icon: '🐦', placeholder: '@yourschool'    },
                { key: 'facebookPage',    icon: '👤', placeholder: 'facebook.com/…' },
                { key: 'linkedinPage',    icon: '💼', placeholder: 'linkedin.com/…' },
                { key: 'youtubeChannel',  icon: '▶️', placeholder: 'youtube.com/@…' },
                { key: 'tiktokHandle',    icon: '🎵', placeholder: '@yourschool'    },
              ].map(({ key, icon, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <span className="mr-1">{icon}</span>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </label>
                  <input
                    className="input-field"
                    value={(brand as any)[key]}
                    onChange={e => set(key as keyof BrandData, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Preview */}
        {brand.organizationName && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Brand Preview</h3>
            <div className="flex items-center gap-4">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="logo" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold" style={{ background: brand.primaryColor }}>
                  {brand.organizationName[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900">{brand.organizationName}</p>
                {brand.tagline && <p className="text-sm text-gray-500">{brand.tagline}</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="w-8 h-8 rounded-full" style={{ background: brand.primaryColor }} title="Primary" />
              <div className="w-8 h-8 rounded-full" style={{ background: brand.secondaryColor }} title="Secondary" />
              <div className="w-8 h-8 rounded-full" style={{ background: brand.accentColor }} title="Accent" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
