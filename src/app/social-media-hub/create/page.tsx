'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SocialMediaNav from '@/components/SocialMediaNav'

/* ─── Static data ─────────────────────────────────────────────────────────── */

const PLATFORMS = [
  { id: 'INSTAGRAM', icon: '📸', label: 'Instagram', color: 'border-pink-300 bg-pink-50 text-pink-700'      },
  { id: 'TWITTER',   icon: '🐦', label: 'Twitter/X', color: 'border-sky-300 bg-sky-50 text-sky-700'         },
  { id: 'FACEBOOK',  icon: '👤', label: 'Facebook',  color: 'border-blue-300 bg-blue-50 text-blue-700'      },
  { id: 'LINKEDIN',  icon: '💼', label: 'LinkedIn',  color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
  { id: 'YOUTUBE',   icon: '▶️', label: 'YouTube',   color: 'border-red-300 bg-red-50 text-red-700'          },
  { id: 'TIKTOK',    icon: '🎵', label: 'TikTok',    color: 'border-gray-300 bg-gray-50 text-gray-700'       },
]

const AI_PLATFORMS = PLATFORMS.filter(p => p.id !== 'YOUTUBE')

const CONTENT_TYPES = [
  { id: 'achievement',  label: '🏆 Achievement & Award' },
  { id: 'academic',     label: '📚 Academic Content' },
  { id: 'event',        label: '📅 Event & Announcement' },
  { id: 'graduation',   label: '🎓 Graduation & Ceremony' },
  { id: 'staff',        label: '👨‍🏫 Teacher & Staff' },
  { id: 'spotlight',    label: '🌟 Student Spotlight' },
  { id: 'data',         label: '📊 Statistics & Data' },
  { id: 'school-life',  label: '🏫 School Life' },
  { id: 'tips',         label: '💡 Education Tips' },
  { id: 'community',    label: '🤝 Community & Social Responsibility' },
]

const TONES = [
  { id: 'professional',  label: '💼 Professional' },
  { id: 'casual',        label: '😊 Casual' },
  { id: 'educational',   label: '🎓 Educational' },
  { id: 'inspirational', label: '🌟 Inspirational' },
  { id: 'celebratory',   label: '🎉 Celebratory' },
]

const LANGUAGES = [
  { id: 'tr', label: '🇹🇷 Turkish' },
  { id: 'en', label: '🇬🇧 English' },
  { id: 'de', label: '🇩🇪 German' },
]

const EMOJI_LEVELS = [
  { id: 'heavy',    label: 'Heavy' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'minimal',  label: 'Minimal' },
  { id: 'none',     label: 'None' },
]

const BEST_TIMES: Record<string, string> = {
  INSTAGRAM: 'Recommended: Tuesday–Friday 12:00–14:00',
  TWITTER:   'Recommended: Weekdays 09:00, 12:00, 17:00',
  FACEBOOK:  'Recommended: Wednesday–Friday 13:00–15:00',
  LINKEDIN:  'Recommended: Tuesday–Thursday 08:00–10:00',
  TIKTOK:    'Recommended: Tuesday and Friday 19:00–21:00',
}

interface Template {
  id: string; category: string; icon: string; title: string
  exampleTopic: string; suggestedPlatforms: string[]; estimatedEngagement: string
}

type Generated = Record<string, Record<string, unknown>>

/* ─── Chip component ──────────────────────────────────────────────────────── */
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
        selected
          ? 'bg-pink-600 text-white border-pink-600'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

/* ─── Platform preview cards ──────────────────────────────────────────────── */

function HashtagChips({
  tags, onRemove, onAdd,
}: { tags: string[]; onRemove: (t: string) => void; onAdd: (t: string) => void }) {
  const [input, setInput] = useState('')
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
            {t}
            <button type="button" onClick={() => onRemove(t)} className="hover:text-red-500 font-bold ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input-field text-xs py-1 flex-1"
          placeholder="Add # and press Enter"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const tag = input.trim().replace(/^#?/, '#')
              if (tag && !tags.includes(tag)) { onAdd(tag); setInput('') }
            }
          }}
        />
      </div>
    </div>
  )
}

/* ─── Main page ───────────────────────────────────────────────────────────── */

export default function CreatePostPage() {
  const router = useRouter()

  /* ── Tab ── */
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai')

  /* ── AI form ── */
  const [topic,              setTopic]              = useState('')
  const [selectedTypes,      setSelectedTypes]      = useState<string[]>([])
  const [aiPlatforms,        setAiPlatforms]        = useState<string[]>([])
  const [tone,               setTone]               = useState('professional')
  const [language,           setLanguage]           = useState('tr')
  const [emojiLevel,         setEmojiLevel]         = useState('moderate')
  const [generating,         setGenerating]         = useState(false)
  const [generated,          setGenerated]          = useState<Generated | null>(null)
  const [editedContent,      setEditedContent]      = useState<Generated>({})
  const [activePlatformTab,  setActivePlatformTab]  = useState('')
  const [showTemplates,      setShowTemplates]       = useState(false)
  const [templates,          setTemplates]          = useState<Template[]>([])
  const [templatesLoading,   setTemplatesLoading]   = useState(false)
  const [showScheduleModal,  setShowScheduleModal]  = useState(false)
  const [scheduleDate,       setScheduleDate]       = useState('')
  const [schedulePlatform,   setSchedulePlatform]   = useState<string | null>(null)
  const [saving,             setSaving]             = useState<string | null>(null)
  const [saveMsg,            setSaveMsg]            = useState('')
  const [aiError,            setAiError]            = useState('')

  /* ── Manual form ── */
  const [title,         setTitle]         = useState('')
  const [content,       setContent]       = useState('')
  const [manPlatforms,  setManPlatforms]  = useState<string[]>([])
  const [status,        setStatus]        = useState<'DRAFT'|'SCHEDULED'|'PUBLISHED'>('DRAFT')
  const [scheduledFor,  setScheduledFor]  = useState('')
  const [tags,          setTags]          = useState('')
  const [notes,         setNotes]         = useState('')
  const [saving2,       setSaving2]       = useState(false)
  const [manError,      setManError]      = useState('')

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Helpers                                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */

  const toggleType = (id: string) =>
    setSelectedTypes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const toggleAiPlatform = (id: string) =>
    setAiPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const toggleManPlatform = (id: string) =>
    setManPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  function patchEdit(platform: string, key: string, value: unknown) {
    setEditedContent(prev => ({
      ...prev,
      [platform]: { ...(prev[platform] ?? {}), [key]: value },
    }))
  }

  function getEdit<T>(platform: string, key: string, fallback: T): T {
    const p = editedContent[platform] as Record<string, unknown> | undefined
    if (p && key in p) return p[key] as T
    const g = generated?.[platform] as Record<string, unknown> | undefined
    return (g?.[key] as T) ?? fallback
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Templates                                                               */
  /* ─────────────────────────────────────────────────────────────────────── */

  async function loadTemplates() {
    if (templates.length > 0) { setShowTemplates(v => !v); return }
    setTemplatesLoading(true)
    const res  = await fetch('/api/social-media/templates')
    const data = await res.json()
    if (data.success) setTemplates(data.templates)
    setTemplatesLoading(false)
    setShowTemplates(true)
  }

  function useTemplate(t: Template) {
    setTopic(t.exampleTopic)
    setAiPlatforms(t.suggestedPlatforms.filter(p => p !== 'YOUTUBE'))
    setShowTemplates(false)
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* AI Generate                                                             */
  /* ─────────────────────────────────────────────────────────────────────── */

  async function handleGenerate() {
    if (!topic.trim()) { setAiError('Topic is required'); return }
    if (!aiPlatforms.length) { setAiError('Please select at least one platform'); return }
    setAiError('')
    setGenerating(true)
    try {
      const res  = await fetch('/api/social-media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, contentTypes: selectedTypes, platforms: aiPlatforms, tone, language, emojiLevel }),
      })
      const data = await res.json()
      if (!data.success) { setAiError(data.error || 'Generation failed'); return }
      setGenerated(data.generated)
      setEditedContent({})
      setActivePlatformTab(aiPlatforms[0])
    } catch {
      setAiError('An error occurred')
    } finally {
      setGenerating(false)
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Save / Schedule                                                         */
  /* ─────────────────────────────────────────────────────────────────────── */

  async function savePost(platform: string, postStatus: 'DRAFT'|'SCHEDULED', scheduledAt?: string) {
    setSaving(platform)
    const g = generated?.[platform] as Record<string, unknown>
    const edited = editedContent[platform] as Record<string, unknown> | undefined

    // Get content for this platform
    let postContent = ''
    let postTags: string[] = []
    if (platform === 'INSTAGRAM') {
      postContent = (edited?.caption ?? g?.caption ?? '') as string
      postTags    = (edited?.hashtags ?? g?.hashtags ?? []) as string[]
    } else if (platform === 'TWITTER') {
      postContent = (edited?.tweet ?? g?.tweet ?? '') as string
    } else if (platform === 'FACEBOOK') {
      postContent = (edited?.content ?? g?.content ?? '') as string
    } else if (platform === 'LINKEDIN') {
      const hook    = (edited?.hook    ?? g?.hook    ?? '') as string
      const body    = (edited?.content ?? g?.content ?? '') as string
      postContent   = hook ? `${hook}\n\n${body}` : body
      postTags      = (edited?.hashtags ?? g?.hashtags ?? []) as string[]
    } else if (platform === 'TIKTOK') {
      const hook    = (edited?.hook        ?? g?.hook        ?? '') as string
      const desc    = (edited?.description ?? g?.description ?? '') as string
      postContent   = hook ? `${hook}\n\n${desc}` : desc
      postTags      = (edited?.hashtags ?? g?.hashtags ?? []) as string[]
    }

    try {
      const res = await fetch('/api/social-media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       `${platform} — ${topic.slice(0, 60)}`,
          content:     postContent,
          platforms:   [platform],
          status:      postStatus,
          scheduledFor: scheduledAt ?? null,
          tags:        postTags,
          notes:       'Created with AI ✨',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSaveMsg(postStatus === 'SCHEDULED' ? `${platform} scheduled ✓` : `${platform} saved as draft ✓`)
        setTimeout(() => setSaveMsg(''), 3000)
      } else {
        setAiError(data.error || 'Save failed')
      }
    } catch {
      setAiError('An error occurred while saving')
    } finally {
      setSaving(null)
    }
  }

  async function saveAllDrafts() {
    if (!generated) return
    for (const platform of aiPlatforms) {
      await savePost(platform, 'DRAFT')
    }
  }

  async function handleScheduleConfirm() {
    if (!schedulePlatform || !scheduleDate) return
    await savePost(schedulePlatform, 'SCHEDULED', scheduleDate)
    setShowScheduleModal(false)
    setScheduleDate('')
    setSchedulePlatform(null)
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Manual form submit                                                       */
  /* ─────────────────────────────────────────────────────────────────────── */

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manPlatforms.length === 0) { setManError('Please select at least one platform'); return }
    if (!content.trim())           { setManError('Content is required'); return }
    setSaving2(true); setManError('')
    try {
      const res  = await fetch('/api/social-media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title || undefined,
          content,
          platforms:   manPlatforms,
          status,
          scheduledFor: status === 'SCHEDULED' && scheduledFor ? scheduledFor : undefined,
          tags:        tags.split(',').map(t => t.trim()).filter(Boolean),
          notes:       notes || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) router.push('/social-media-hub/posts')
      else setManError(data.error || 'Save failed')
    } catch {
      setManError('An error occurred')
    } finally {
      setSaving2(false)
    }
  }

  const manCharLimit = manPlatforms.includes('TWITTER') ? 280 : 2200

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Render helpers                                                           */
  /* ─────────────────────────────────────────────────────────────────────── */

  function renderInstagram() {
    const caption    = getEdit<string>('instagram', 'caption', '')
    const hashtags   = getEdit<string[]>('instagram', 'hashtags', [])
    const imagePrompt = getEdit<string>('instagram', 'imagePrompt', '')
    return (
      <div className="space-y-4">
        {imagePrompt && (
          <div className="p-3 bg-pink-50 rounded-xl border border-pink-100 text-sm italic text-pink-700">
            📸 Image suggestion: {imagePrompt}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Caption</label>
          <textarea
            className="input-field resize-none"
            rows={6}
            value={caption}
            onChange={e => patchEdit('instagram', 'caption', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Hashtags</label>
          <HashtagChips
            tags={hashtags}
            onRemove={t => patchEdit('instagram', 'hashtags', hashtags.filter(h => h !== t))}
            onAdd={t => patchEdit('instagram', 'hashtags', [...hashtags, t])}
          />
        </div>
      </div>
    )
  }

  function renderTwitter() {
    const tweet  = getEdit<string>('twitter', 'tweet', '')
    const thread = getEdit<string[]>('twitter', 'thread', [])
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold text-gray-700">Main Tweet</label>
            <span className={`text-xs font-mono ${tweet.length > 280 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {tweet.length}/280
            </span>
          </div>
          <textarea
            className="input-field resize-none"
            rows={3}
            value={tweet}
            onChange={e => patchEdit('twitter', 'tweet', e.target.value)}
          />
          {tweet.length > 280 && <p className="text-xs text-red-500 mt-1">You have exceeded the 280 character limit</p>}
        </div>
        {thread.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Thread Version</label>
            <div className="space-y-2">
              {thread.map((tw, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-xs font-bold text-gray-400 mt-2.5 shrink-0">{i + 1}.</span>
                  <textarea
                    className="input-field resize-none flex-1 text-sm"
                    rows={2}
                    value={tw}
                    onChange={e => {
                      const updated = [...thread]
                      updated[i] = e.target.value
                      patchEdit('twitter', 'thread', updated)
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderFacebook() {
    const fbContent = getEdit<string>('facebook', 'content', '')
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
        <textarea
          className="input-field resize-none"
          rows={8}
          value={fbContent}
          onChange={e => patchEdit('facebook', 'content', e.target.value)}
        />
      </div>
    )
  }

  function renderLinkedin() {
    const hook     = getEdit<string>('linkedin', 'hook', '')
    const liContent = getEdit<string>('linkedin', 'content', '')
    const hashtags = getEdit<string[]>('linkedin', 'hashtags', [])
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Hook (Opening Line)</label>
          <input
            className="input-field"
            value={hook}
            onChange={e => patchEdit('linkedin', 'hook', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
          <textarea
            className="input-field resize-none"
            rows={7}
            value={liContent}
            onChange={e => patchEdit('linkedin', 'content', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Hashtags</label>
          <HashtagChips
            tags={hashtags}
            onRemove={t => patchEdit('linkedin', 'hashtags', hashtags.filter(h => h !== t))}
            onAdd={t => patchEdit('linkedin', 'hashtags', [...hashtags, t])}
          />
        </div>
      </div>
    )
  }

  function renderTiktok() {
    const hook        = getEdit<string>('tiktok', 'hook', '')
    const description = getEdit<string>('tiktok', 'description', '')
    const hashtags    = getEdit<string[]>('tiktok', 'hashtags', [])
    const sound       = getEdit<string>('tiktok', 'soundSuggestion', '')
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Hook (First 3 seconds)</label>
          <input
            className="input-field"
            value={hook}
            onChange={e => patchEdit('tiktok', 'hook', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            className="input-field resize-none"
            rows={4}
            value={description}
            onChange={e => patchEdit('tiktok', 'description', e.target.value)}
          />
        </div>
        {sound && (
          <p className="text-xs italic text-gray-500">🎵 Sound suggestion: {sound}</p>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Hashtags</label>
          <HashtagChips
            tags={hashtags}
            onRemove={t => patchEdit('tiktok', 'hashtags', hashtags.filter(h => h !== t))}
            onAdd={t => patchEdit('tiktok', 'hashtags', [...hashtags, t])}
          />
        </div>
      </div>
    )
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Render                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      <SocialMediaNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Post</h2>
          <p className="text-gray-500 text-sm">Create new social media content</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'ai'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ✨ Create with AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'manual'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ✏️ Write Manually
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* AI TAB                                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'ai' && !generated && (
          <div className="space-y-5">
            {/* Topic */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Post Topic <span className="text-red-400">*</span>
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder={`What would you like to create a post about?\nExample: We won first place in the math olympiad this month`}
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>

            {/* Templates */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Templates</span>
                <button
                  type="button"
                  onClick={loadTemplates}
                  className="text-xs text-pink-600 font-semibold hover:underline"
                >
                  {showTemplates ? 'Close ▲' : 'Choose from Templates ▼'}
                </button>
              </div>
              {showTemplates && (
                templatesLoading ? (
                  <p className="text-sm text-gray-400">Loading…</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => useTemplate(t)}
                        className="text-left p-3 rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
                      >
                        <div className="text-xl mb-1">{t.icon}</div>
                        <div className="text-xs font-semibold text-gray-700">{t.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Engagement: {t.estimatedEngagement}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Content types */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Content Type</label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map(ct => (
                  <Chip
                    key={ct.id}
                    label={ct.label}
                    selected={selectedTypes.includes(ct.id)}
                    onClick={() => toggleType(ct.id)}
                  />
                ))}
              </div>
            </div>

            {/* Platform selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Platform Selection <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {AI_PLATFORMS.map(p => {
                  const selected = aiPlatforms.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleAiPlatform(p.id)}
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

            {/* Tone + Language + Emoji */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <Chip
                      key={t.id}
                      label={t.label}
                      selected={tone === t.id}
                      onClick={() => setTone(t.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                <div className="flex gap-2">
                  {LANGUAGES.map(l => (
                    <Chip
                      key={l.id}
                      label={l.label}
                      selected={language === l.id}
                      onClick={() => setLanguage(l.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Emoji Usage</label>
                <div className="flex gap-2">
                  {EMOJI_LEVELS.map(el => (
                    <Chip
                      key={el.id}
                      label={el.label}
                      selected={emojiLevel === el.id}
                      onClick={() => setEmojiLevel(el.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {aiError && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{aiError}</p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 rounded-xl text-white text-lg font-bold bg-pink-600 hover:bg-pink-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating content…
                </>
              ) : '✨ Create with AI'}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* AI RESULTS                                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'ai' && generated && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">✨ Your content is ready!</h3>
                <p className="text-sm text-gray-500">{topic.slice(0, 80)}</p>
              </div>
              <button
                type="button"
                onClick={() => { setGenerated(null); setEditedContent({}) }}
                className="text-sm text-pink-600 font-semibold hover:underline"
              >
                ← Create new
              </button>
            </div>

            {saveMsg && (
              <div className="px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
                ✓ {saveMsg}
              </div>
            )}
            {aiError && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{aiError}</p>
            )}

            {/* Platform tabs */}
            <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1">
              {aiPlatforms.map(pid => {
                const p = AI_PLATFORMS.find(x => x.id === pid)!
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => setActivePlatformTab(pid)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activePlatformTab === pid
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {p.icon} {p.label}
                  </button>
                )
              })}
            </div>

            {/* Platform content card */}
            {aiPlatforms.map(pid => {
              if (activePlatformTab !== pid) return null
              const p = AI_PLATFORMS.find(x => x.id === pid)!
              const borderColors: Record<string, string> = {
                INSTAGRAM: 'border-t-pink-500',
                TWITTER:   'border-t-sky-500',
                FACEBOOK:  'border-t-blue-500',
                LINKEDIN:  'border-t-indigo-500',
                TIKTOK:    'border-t-gray-700',
              }
              return (
                <div key={pid} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 ${borderColors[pid] ?? ''}`}>
                  <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-gray-100">
                    <span className="text-xl">{p.icon}</span>
                    <span className="font-semibold text-gray-800">{p.label}</span>
                  </div>
                  <div className="p-6">
                    {pid === 'INSTAGRAM' && renderInstagram()}
                    {pid === 'TWITTER'   && renderTwitter()}
                    {pid === 'FACEBOOK'  && renderFacebook()}
                    {pid === 'LINKEDIN'  && renderLinkedin()}
                    {pid === 'TIKTOK'    && renderTiktok()}
                  </div>
                  {/* Action buttons */}
                  <div className="px-6 pb-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSchedulePlatform(pid)
                        setShowScheduleModal(true)
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium border-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all"
                    >
                      📅 Schedule
                    </button>
                    <button
                      type="button"
                      disabled={saving === pid}
                      onClick={() => savePost(pid, 'DRAFT')}
                      className="px-4 py-2 rounded-xl text-sm font-medium border-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      {saving === pid ? '…' : '💾 Save Draft'}
                    </button>
                    <div className="relative group">
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-xl text-sm font-medium border-2 border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                      >
                        🚀 Publish Now
                      </button>
                      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
                        <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap">
                          Account connection required
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Bulk actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setSchedulePlatform('ALL')
                  setShowScheduleModal(true)
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all"
              >
                📅 Schedule All
              </button>
              <button
                type="button"
                onClick={saveAllDrafts}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700 transition-all"
              >
                💾 Save All
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MANUAL TAB                                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            {/* Platform selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Platforms <span className="text-red-400">*</span></h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PLATFORMS.map(p => {
                  const selected = manPlatforms.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleManPlatform(p.id)}
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
                  <label className="block text-sm font-semibold text-gray-700">Content <span className="text-red-400">*</span></label>
                  <span className={`text-xs ${content.length > manCharLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    {content.length}/{manCharLimit}
                  </span>
                </div>
                <textarea
                  className="input-field resize-none"
                  rows={7}
                  placeholder="Write your content here…"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tags / Hashtags <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input
                  className="input-field"
                  placeholder="#education, #school, #achievement"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Internal Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Notes for yourself or your team…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
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
                    {s === 'DRAFT' ? '📝 Save Draft' : s === 'SCHEDULED' ? '📅 Schedule' : '🚀 Publish Now'}
                  </button>
                ))}
              </div>
              {status === 'SCHEDULED' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date and Time</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={scheduledFor}
                    onChange={e => setScheduledFor(e.target.value)}
                  />
                </div>
              )}
            </div>

            {manError && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{manError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving2} className="btn-primary disabled:opacity-50">
                {saving2 ? 'Saving…' : status === 'DRAFT' ? 'Save Draft' : status === 'SCHEDULED' ? 'Schedule' : 'Publish'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCHEDULE MODAL                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">📅 Schedule</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date and Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
              />
            </div>
            {schedulePlatform && schedulePlatform !== 'ALL' && BEST_TIMES[schedulePlatform] && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                💡 Tip: {BEST_TIMES[schedulePlatform]}
              </p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowScheduleModal(false); setScheduleDate(''); setSchedulePlatform(null) }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (schedulePlatform === 'ALL') {
                    for (const pid of aiPlatforms) {
                      await savePost(pid, 'SCHEDULED', scheduleDate)
                    }
                    setShowScheduleModal(false)
                    setScheduleDate('')
                    setSchedulePlatform(null)
                  } else {
                    await handleScheduleConfirm()
                  }
                }}
                disabled={!scheduleDate}
                className="btn-primary disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
