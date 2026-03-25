'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

// ─── Types ─────────────────────────────────────────────────────────────────
type ChatMsg = { role: 'user' | 'assistant'; content: string; timestamp: string }

interface Profile {
  targetRegion: string[]
  educationLevel: string | null
  startYear: string | null
  fieldOfInterest: string | null
  scholarshipNeeded: string | null
  gpa: number | null
  examScores: Record<string, number> | null
  universityList: { reach: any[]; match: any[]; safety: any[] } | null
  documentStatus: Record<string, string> | null
  chatHistory: ChatMsg[] | null
  lastActivePhase: number
  applicationYear: string | null
}

interface ChecklistSection {
  title: string
  items: { id: string; label: string; category: string; status: string }[]
}

const STATUS_CYCLE = ['not_started', 'in_progress', 'ready', 'submitted']
const STATUS_ICON: Record<string, string> = {
  not_started: '❌',
  in_progress: '🔄',
  ready: '✅',
  submitted: '📤',
}
const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  ready: 'Ready',
  submitted: 'Submitted',
}

const QUICK_STARTERS = [
  { emoji: '🌍', label: 'Choose target countries' },
  { emoji: '📚', label: 'Explore majors' },
  { emoji: '📋', label: 'Check documents' },
  { emoji: '🏛️', label: 'Get university suggestions' },
]

function computeCompletion(profile: Profile | null): number {
  if (!profile) return 0
  const checks = [
    profile.targetRegion?.length > 0,
    !!profile.educationLevel,
    !!profile.startYear,
    !!profile.fieldOfInterest,
    profile.gpa != null,
    !!profile.examScores,
    !!profile.universityList,
    !!profile.documentStatus,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function ProfilePanel({
  profile,
  studentName,
  className,
  schoolName,
  completion,
}: {
  profile: Profile | null
  studentName: string
  className: string
  schoolName: string
  completion: number
}) {
  const uniList = profile?.universityList
  const docStatus = profile?.documentStatus ?? {}
  const readyDocs = Object.values(docStatus).filter(s => s === 'ready' || s === 'submitted').length
  const totalDocs = Object.keys(docStatus).length

  return (
    <div className="space-y-4">
      {/* Student info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            {studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{studentName}</p>
            <p className="text-xs text-gray-500">{className} · {schoolName}</p>
          </div>
        </div>

        {/* Profile completion */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-gray-600">Profile Completion</span>
            <span className="text-xs font-bold text-indigo-600">{completion}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        {/* Quick info */}
        {profile && (
          <div className="space-y-1.5">
            {profile.targetRegion.length > 0 && (
              <p className="text-xs text-gray-600">🌍 <span className="font-medium">{profile.targetRegion.join(', ')}</span></p>
            )}
            {profile.fieldOfInterest && (
              <p className="text-xs text-gray-600">📚 <span className="font-medium">{profile.fieldOfInterest}</span></p>
            )}
            {profile.startYear && (
              <p className="text-xs text-gray-600">📅 <span className="font-medium">Fall {profile.startYear}</span></p>
            )}
            {profile.gpa != null && (
              <p className="text-xs text-gray-600">📊 <span className="font-medium">GPA: {profile.gpa}/100</span></p>
            )}
            {profile.examScores && Object.keys(profile.examScores).length > 0 && (
              <p className="text-xs text-gray-600">📝 <span className="font-medium">
                {Object.entries(profile.examScores).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </span></p>
            )}
          </div>
        )}
      </div>

      {/* University list */}
      {uniList && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">University List</p>
          <div className="space-y-1.5">
            {uniList.reach.length > 0 && (
              <p className="text-xs text-gray-600">🎯 <span className="font-medium">Reach:</span> {uniList.reach.length} school{uniList.reach.length !== 1 ? 's' : ''}</p>
            )}
            {uniList.match.length > 0 && (
              <p className="text-xs text-gray-600">✅ <span className="font-medium">Match:</span> {uniList.match.length} school{uniList.match.length !== 1 ? 's' : ''}</p>
            )}
            {uniList.safety.length > 0 && (
              <p className="text-xs text-gray-600">🛡️ <span className="font-medium">Safety:</span> {uniList.safety.length} school{uniList.safety.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
      )}

      {/* Document status */}
      {totalDocs > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Documents</p>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: totalDocs > 0 ? `${(readyDocs / totalDocs) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-gray-500">{readyDocs}/{totalDocs} documents ready</p>
        </div>
      )}
    </div>
  )
}

function ChatBubble({ msg, streaming }: { msg: ChatMsg; streaming?: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-1">
          U
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md text-white'
            : 'rounded-bl-md bg-blue-50 text-gray-800 border border-blue-100'
        }`}
        style={isUser ? { backgroundColor: 'var(--primary)' } : {}}
      >
        <p className="whitespace-pre-wrap">{msg.content}{streaming && <span className="inline-block w-1 h-4 bg-current ml-0.5 animate-pulse">▌</span>}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
          {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function ChecklistTab({ sections, onToggle }: { sections: ChecklistSection[]; onToggle: (itemId: string, nextStatus: string) => void }) {
  return (
    <div className="space-y-5">
      {sections.map(section => (
        <div key={section.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">{section.title}</h3>
          <div className="space-y-2">
            {section.items.map(item => {
              const currentIdx = STATUS_CYCLE.indexOf(item.status)
              const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
              return (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id, nextStatus)}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-base shrink-0">{STATUS_ICON[item.status]}</span>
                  <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                  <span className={`text-xs font-medium shrink-0 ${
                    item.status === 'ready' || item.status === 'submitted' ? 'text-emerald-600' :
                    item.status === 'in_progress' ? 'text-amber-600' : 'text-gray-400'
                  }`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Chat with UniPath to generate your personalized checklist!</p>
        </div>
      )}
    </div>
  )
}

function UniversitiesTab({ universityList, onChange }: {
  universityList: { reach: any[]; match: any[]; safety: any[] } | null
  onChange: (list: { reach: any[]; match: any[]; safety: any[] }) => void
}) {
  const list = universityList ?? { reach: [], match: [], safety: [] }
  const [adding, setAdding] = useState<'reach' | 'match' | 'safety' | null>(null)
  const [newUni, setNewUni] = useState('')

  const addUniversity = (tier: 'reach' | 'match' | 'safety') => {
    if (!newUni.trim()) return
    const updated = { ...list, [tier]: [...(list[tier] ?? []), { name: newUni.trim(), addedManually: true }] }
    onChange(updated)
    setNewUni('')
    setAdding(null)
  }

  const removeUniversity = (tier: 'reach' | 'match' | 'safety', index: number) => {
    const updated = { ...list, [tier]: list[tier].filter((_: any, i: number) => i !== index) }
    onChange(updated)
  }

  const tiers = [
    { key: 'reach' as const, label: 'Reach', emoji: '🎯', color: 'border-red-200 bg-red-50/50', badge: 'bg-red-100 text-red-700' },
    { key: 'match' as const, label: 'Match', emoji: '✅', color: 'border-emerald-200 bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700' },
    { key: 'safety' as const, label: 'Safety', emoji: '🛡️', color: 'border-blue-200 bg-blue-50/50', badge: 'bg-blue-100 text-blue-700' },
  ]

  return (
    <div className="space-y-4">
      {tiers.map(tier => (
        <div key={tier.key} className={`rounded-2xl border p-5 ${tier.color}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span>{tier.emoji}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tier.badge}`}>{tier.label.toUpperCase()}</span>
              <span className="text-xs text-gray-500">{list[tier.key]?.length ?? 0} schools</span>
            </div>
            <button
              onClick={() => setAdding(tier.key)}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
            >
              + Add
            </button>
          </div>

          {(list[tier.key] ?? []).map((uni: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 mb-2 border border-white/80">
              <div>
                <p className="text-sm font-semibold text-gray-900">{uni.name}</p>
                {uni.location && <p className="text-xs text-gray-400">{uni.location}</p>}
              </div>
              <button
                onClick={() => removeUniversity(tier.key, i)}
                className="text-gray-300 hover:text-red-400 text-xs transition-colors ml-2"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}

          {adding === tier.key && (
            <div className="flex gap-2 mt-2">
              <input
                autoFocus
                value={newUni}
                onChange={e => setNewUni(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addUniversity(tier.key); if (e.key === 'Escape') setAdding(null) }}
                placeholder="University name..."
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button onClick={() => addUniversity(tier.key)} className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold">Add</button>
              <button onClick={() => setAdding(null)} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">Cancel</button>
            </div>
          )}

          {(list[tier.key] ?? []).length === 0 && adding !== tier.key && (
            <p className="text-xs text-gray-400 italic">No schools added yet. Chat with UniPath for recommendations!</p>
          )}
        </div>
      ))}
    </div>
  )
}

function TimelineTab({ profile }: { profile: Profile | null }) {
  const startYear = parseInt(profile?.startYear ?? '2027')
  const today = new Date()

  const milestones = [
    { date: new Date(`September 1, ${startYear - 2}`), label: `Start 9th grade`, done: true },
    { date: new Date(`October 1, ${startYear - 2}`), label: 'Open UniPath profile', done: !!profile },
    { date: new Date(`June 1, ${startYear - 1}`), label: 'Take TOEFL/IELTS', done: false },
    { date: new Date(`July 1, ${startYear - 1}`), label: 'Finalize university list', done: !!(profile?.universityList) },
    { date: new Date(`August 1, ${startYear - 1}`), label: 'Start Common App / UCAS essay', done: false },
    { date: new Date(`October 1, ${startYear - 1}`), label: 'Ask teachers for recommendation letters', done: false },
    { date: new Date(`November 1, ${startYear - 1}`), label: 'Early Decision / Action deadline', done: false },
    { date: new Date(`January 1, ${startYear}`), label: 'Regular Decision deadline', done: false },
    { date: new Date(`April 1, ${startYear}`), label: 'Compare acceptance letters', done: false },
    { date: new Date(`May 1, ${startYear}`), label: 'Commit to university (May 1)', done: false },
    { date: new Date(`September 1, ${startYear}`), label: `🎓 Start university!`, done: false },
  ]

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4 ml-14">
        {milestones.map((m, i) => {
          const isPast = m.date < today && !m.done
          const isToday = Math.abs(m.date.getTime() - today.getTime()) < 30 * 24 * 60 * 60 * 1000 && !m.done
          const icon = m.done ? '✅' : isPast ? '⚠️' : isToday ? '🔵' : '📅'
          const dotColor = m.done ? 'bg-emerald-500' : isPast ? 'bg-red-400' : isToday ? 'bg-blue-500' : 'bg-gray-200'
          const textColor = m.done ? 'text-emerald-700' : isPast ? 'text-red-600' : isToday ? 'text-blue-700 font-bold' : 'text-gray-600'

          return (
            <div key={i} className="relative flex items-start gap-4">
              {/* Dot */}
              <div className={`absolute -left-[2.35rem] top-1 w-3 h-3 rounded-full border-2 border-white ${dotColor} shadow-sm`} />

              <div className={`rounded-xl border px-4 py-3 flex-1 ${m.done ? 'bg-emerald-50/50 border-emerald-100' : isPast ? 'bg-red-50/50 border-red-100' : isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${textColor}`}>
                    {icon} {m.label}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {m.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {isPast && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Overdue — take action now</p>
                )}
                {isToday && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">📍 Current milestone</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function UniPathPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [isNinthGrade, setIsNinthGrade] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [studentInfo, setStudentInfo] = useState({ name: '', className: '', schoolName: '' })
  const [loading, setLoading] = useState(true)

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const [activeTab, setActiveTab] = useState<'chat' | 'universities' | 'checklist' | 'timeline'>('chat')
  const [checklist, setChecklist] = useState<ChecklistSection[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, streamingContent, scrollToBottom])

  // Load profile
  useEffect(() => {
    fetch('/api/student/unipath/profile')
      .then(r => r.json())
      .then(data => {
        setIsNinthGrade(data.isNinthGrade ?? false)
        setStudentInfo(data.student ?? { name: session?.user?.name ?? '', className: '', schoolName: '' })
        if (data.profile) {
          setProfile(data.profile)
          const history: ChatMsg[] = data.profile.chatHistory ?? []
          setMessages(history.slice(-30))
        } else {
          // First time — set welcome message
          const welcomeMsg: ChatMsg = {
            role: 'assistant',
            content: `Merhaba ${data.student?.name?.split(' ')[0] ?? 'there'}! 🎓 Ben UniPath, yurtdışı üniversite başvuru sürecinde sana eşlik edecek AI danışmanın.\n\nSeni tanımadan başlayamam — hangi ülke ya da bölgelere başvurmayı düşünüyorsun? (Örn: ABD, İngiltere, Kanada, AB ülkeleri)`,
            timestamp: new Date().toISOString(),
          }
          setMessages([welcomeMsg])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session])

  // Load checklist when tab opens
  useEffect(() => {
    if (activeTab === 'checklist' && isNinthGrade) {
      fetch('/api/student/unipath/checklist')
        .then(r => r.json())
        .then(data => { if (data.success) setChecklist(data.checklist) })
        .catch(console.error)
    }
  }, [activeTab, isNinthGrade])

  const sendMessage = async () => {
    if (!input.trim() || streaming) return
    const userMsg: ChatMsg = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/student/unipath/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      })

      if (!res.ok) {
        const err = await res.json()
        const errMsg: ChatMsg = { role: 'assistant', content: `⚠️ ${err.error ?? 'Something went wrong. Please try again.'}`, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, errMsg])
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setStreamingContent(full)
      }

      const aiMsg: ChatMsg = { role: 'assistant', content: full, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, aiMsg])
      setStreamingContent('')

      // Refresh profile in background
      fetch('/api/student/unipath/profile')
        .then(r => r.json())
        .then(data => { if (data.profile) setProfile(data.profile) })
        .catch(() => {})
    } catch (err) {
      const errMsg: ChatMsg = { role: 'assistant', content: '⚠️ Connection error. Please try again.', timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleChecklistToggle = async (itemId: string, nextStatus: string) => {
    setChecklist(prev => prev.map(section => ({
      ...section,
      items: section.items.map(item => item.id === itemId ? { ...item, status: nextStatus } : item),
    })))
    await fetch('/api/student/unipath/checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, status: nextStatus }),
    })
  }

  const handleUniversityChange = async (list: { reach: any[]; match: any[]; safety: any[] }) => {
    setProfile(prev => prev ? { ...prev, universityList: list } : prev)
    await fetch('/api/student/unipath/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ universityList: list }),
    })
  }

  const completion = computeCompletion(profile)

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading UniPath...</p>
        </div>
      </div>
    )
  }

  // ── Not 9th grade ────────────────────────────────────────────────────────
  if (isNinthGrade === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">UniPath Coming Soon</h1>
          <p className="text-gray-500 leading-relaxed mb-6">
            UniPath University Advisor will be available when you reach 9th grade.
            Keep working hard and building your academic profile!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold border border-indigo-200 mb-8">
            ⏳ Available from 9th grade
          </div>
          <br />
          <button
            onClick={() => router.push('/student/dashboard')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Main page ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                U
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">UniPath AI</h1>
                <p className="text-xs text-gray-400">University Advisor</p>
              </div>
              <span className="hidden sm:inline text-xs font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 ml-1">
                Grade 9 · Exclusive
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <span>Profile: {completion}%</span>
                <div className="w-16 h-1.5 rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${completion}%` }} />
                </div>
              </div>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-full">

          {/* ── Left: Profile Panel ── */}
          <div className="lg:col-span-1">
            <ProfilePanel
              profile={profile}
              studentName={studentInfo.name || session?.user?.name || ''}
              className={studentInfo.className}
              schoolName={studentInfo.schoolName}
              completion={completion}
            />
          </div>

          {/* ── Right: Chat + Tabs ── */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 mb-4 w-fit">
              {(['chat', 'universities', 'checklist', 'timeline'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab === 'chat' ? '💬 Advisor' : tab === 'universities' ? '🏛️ Universities' : tab === 'checklist' ? '📋 Checklist' : '📅 Timeline'}
                </button>
              ))}
            </div>

            {/* ── Chat Tab ── */}
            {activeTab === 'chat' && (
              <div className="flex flex-col flex-1 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden" style={{ minHeight: '520px' }}>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">U</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">UniPath AI</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-gray-400">University Advisor · Powered by Claude AI</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: '400px' }}>
                  {messages.map((msg, i) => (
                    <ChatBubble key={i} msg={msg} />
                  ))}
                  {streaming && streamingContent && (
                    <ChatBubble
                      msg={{ role: 'assistant', content: streamingContent, timestamp: new Date().toISOString() }}
                      streaming
                    />
                  )}
                  {streaming && !streamingContent && (
                    <div className="flex justify-start mb-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1">U</div>
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <span className="text-xs text-gray-400">UniPath is thinking</span>
                          <span className="flex gap-0.5">
                            {[0, 1, 2].map(i => (
                              <span key={i} className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick starters (show when only welcome message) */}
                {messages.length <= 1 && !streaming && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-400 mb-2">Quick start:</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_STARTERS.map((qs, i) => (
                        <button
                          key={i}
                          onClick={() => { setInput(qs.label); textareaRef.current?.focus() }}
                          className="text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                        >
                          {qs.emoji} {qs.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="px-4 pb-4">
                  <div className="flex gap-2 items-end rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 focus-within:border-indigo-300 focus-within:bg-white transition-colors">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={streaming}
                      placeholder="Ask UniPath anything about university applications..."
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none py-0.5 max-h-32"
                      style={{ lineHeight: '1.5' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={streaming || !input.trim()}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 shrink-0"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-center">AI may make mistakes. Verify requirements on official university websites.</p>
                </div>
              </div>
            )}

            {/* ── Universities Tab ── */}
            {activeTab === 'universities' && (
              <div className="flex-1 overflow-y-auto">
                <UniversitiesTab
                  universityList={profile?.universityList ?? null}
                  onChange={handleUniversityChange}
                />
              </div>
            )}

            {/* ── Checklist Tab ── */}
            {activeTab === 'checklist' && (
              <div className="flex-1 overflow-y-auto">
                <ChecklistTab sections={checklist} onToggle={handleChecklistToggle} />
              </div>
            )}

            {/* ── Timeline Tab ── */}
            {activeTab === 'timeline' && (
              <div className="flex-1 overflow-y-auto">
                <TimelineTab profile={profile} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
