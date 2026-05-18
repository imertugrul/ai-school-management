'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorksheetView, usePdfDownload, type WorksheetContent } from '@/components/WorksheetView'

interface Course { id: string; code: string; name: string }
interface ClassItem { id: string; name: string }
interface LessonPlan {
  id: string
  title: string
  date: string
  duration: number
  objectives: string
  materials: string | null
  activities: string
  assessment: string | null
  homework: string | null
  notes: string | null
  course: Course
  class: ClassItem | null
}

const COURSE_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-indigo-500 to-indigo-600',
  'from-rose-500 to-rose-600',
]

export default function LessonPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [assignments, setAssignments] = useState<{ courseId: string; classId: string; course: Course; class: ClassItem }[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const [form, setForm] = useState({
    courseId: '', classId: '', title: '', date: '',
    duration: 45, objectives: '', materials: '', activities: '',
    assessment: '', homework: '', notes: ''
  })

  // ── Worksheet builder state ────────────────────────────────────────────────
  const [showWorksheet, setShowWorksheet] = useState(false)
  const [wsPlanId, setWsPlanId] = useState('')
  const [wsTypes, setWsTypes] = useState<string[]>(['practice'])
  const [wsLanguage, setWsLanguage] = useState<'tr' | 'en'>('tr')
  const [wsQuestionCount, setWsQuestionCount] = useState(5)
  const [wsGenerating, setWsGenerating] = useState(false)
  const [wsError, setWsError] = useState('')
  const [worksheet, setWorksheet] = useState<WorksheetContent | null>(null)
  const [worksheetMeta, setWorksheetMeta] = useState<any>(null)
  const [worksheetId, setWorksheetId] = useState<string | null>(null)
  const { downloading: pdfDownloading, download: downloadPdf } = usePdfDownload()

  // ── Saved worksheets ───────────────────────────────────────────────────────
  interface SavedWorksheet {
    id: string
    title: string
    topic: string
    grade: string | null
    language: string
    createdAt: string
    lessonPlan: { id: string; title: string; course: { code: string; name: string }; class: { name: string } | null } | null
  }
  const [savedWorksheets, setSavedWorksheets] = useState<SavedWorksheet[]>([])
  const [savedLoading, setSavedLoading] = useState(true)

  const fetchSavedWorksheets = async () => {
    setSavedLoading(true)
    try {
      const res = await fetch('/api/teacher/worksheets')
      const data = await res.json()
      if (data.success) setSavedWorksheets(data.worksheets)
    } finally {
      setSavedLoading(false)
    }
  }

  useEffect(() => { fetchSavedWorksheets() }, [])

  const toggleWsType = (t: string) => {
    setWsTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const generateWorksheet = async () => {
    if (!wsPlanId) { setWsError('Önce bir ders planı seçin.'); return }
    if (wsTypes.length === 0) { setWsError('En az bir worksheet tipi seçin.'); return }
    setWsError(''); setWsGenerating(true); setWorksheet(null); setWorksheetMeta(null); setWorksheetId(null)
    try {
      const res = await fetch(`/api/teacher/lesson-plans/${wsPlanId}/worksheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: wsTypes, language: wsLanguage, questionCount: wsQuestionCount }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Worksheet oluşturulamadı.')
      setWorksheet(data.worksheet)
      setWorksheetMeta(data.meta)
      setWorksheetId(data.worksheetId ?? null)
      fetchSavedWorksheets()
    } catch (err: any) {
      setWsError(err.message)
    } finally {
      setWsGenerating(false)
    }
  }

  const printWorksheet = () => window.print()

  const handleDeleteWorksheet = async (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation()
    if (!confirm('Bu worksheet\'i silmek istediğinize emin misiniz?')) return
    await fetch(`/api/teacher/worksheets/${wsId}`, { method: 'DELETE' })
    if (worksheetId === wsId) { setWorksheet(null); setWorksheetMeta(null); setWorksheetId(null) }
    fetchSavedWorksheets()
  }

  const handlePdfFromList = async (e: React.MouseEvent, ws: SavedWorksheet) => {
    e.stopPropagation()
    // Open detail page so the DOM exists, then user can hit PDF there.
    // (Generating PDF for a non-rendered worksheet would require fetching + rendering off-screen — handled by detail page.)
    router.push(`/teacher/worksheets/${ws.id}`)
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [month])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/lesson-plans?month=${month}`)
      const data = await res.json()
      if (data.success) setPlans(data.lessonPlans)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    const res = await fetch('/api/teacher/assignments')
    const data = await res.json()
    if (data.success) {
      setAssignments(data.assignments)
      // Unique classes
      const cls: ClassItem[] = []
      const seen = new Set<string>()
      for (const a of data.assignments) {
        if (a.class && !seen.has(a.classId)) {
          seen.add(a.classId)
          cls.push(a.class)
        }
      }
      setClasses(cls)
    }
  }

  const handleSave = async () => {
    if (!form.courseId || !form.title || !form.date || !form.objectives || !form.activities) {
      setError('Course, title, date, objectives, and activities are required.')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch('/api/teacher/lesson-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setShowForm(false)
      setForm({ courseId: '', classId: '', title: '', date: '', duration: 45, objectives: '', materials: '', activities: '', assessment: '', homework: '', notes: '' })
      fetchPlans()
    } else {
      setError(data.error || 'Failed to save')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this lesson plan?')) return
    await fetch(`/api/teacher/lesson-plans/${id}`, { method: 'DELETE' })
    fetchPlans()
  }

  const openPlan = (id: string) => router.push(`/teacher/lesson-plans/${id}`)

  const uniqueCourseIds = [...new Set(plans.map(p => p.course.id))]
  const courseColor = (courseId: string) => COURSE_COLORS[uniqueCourseIds.indexOf(courseId) % COURSE_COLORS.length]

  const [y, m] = month.split('-').map(Number)
  const monthLabel = new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    const d = new Date(y, m - 2)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextMonth = () => {
    const d = new Date(y, m)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Lesson Plans</h1>
                <p className="text-xs text-gray-500">Plan and organize your lessons</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/teacher/dashboard')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Create Plan Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className={`group relative overflow-hidden text-left rounded-2xl bg-white p-6 shadow-sm border-2 transition-all duration-300 ${showForm ? 'border-indigo-400 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'}`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-xl">✏️</span>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Manual Plan</h3>
            <p className="text-sm text-gray-500">Write your lesson plan from scratch with your own content</p>
          </button>

          <button
            onClick={() => router.push('/teacher/lesson-planner')}
            className="group relative overflow-hidden text-left rounded-2xl bg-white p-6 shadow-sm border-2 border-violet-200 hover:border-violet-400 hover:shadow-md transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 to-purple-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-xl">🤖</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-gray-900">AI Lesson Plan</h3>
                <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-sm text-gray-500">Let Claude AI generate a complete, ready-to-use lesson plan in seconds</p>
            </div>
          </button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-600">←</button>
          <h2 className="text-xl font-bold text-gray-900">{monthLabel}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-600">→</button>
        </div>

        {/* New Plan Form */}
        {showForm && (
          <div className="card mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">New Lesson Plan</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Course *</label>
                <select className="input-field" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                  <option value="">Select course</option>
                  {[...new Map(assignments.map(a => [a.courseId, a.course])).entries()].map(([id, c]) => (
                    <option key={id} value={id}>{c.code} – {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
                <select className="input-field" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                  <option value="">Any / All classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Algebra" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (min)</label>
                <input type="number" className="input-field" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
              </div>
            </div>

            {[
              { key: 'objectives', label: 'Learning Objectives *', placeholder: 'What students will learn...' },
              { key: 'materials', label: 'Materials Needed', placeholder: 'Books, worksheets, supplies...' },
              { key: 'activities', label: 'Activities *', placeholder: 'Step-by-step lesson activities...' },
              { key: 'assessment', label: 'Assessment', placeholder: 'How learning will be assessed...' },
              { key: 'homework', label: 'Homework', placeholder: 'Assignments for students...' },
              { key: 'notes', label: 'Teacher Notes', placeholder: 'Personal notes...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Plan'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Plans list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lesson plans yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first plan for {monthLabel} — manually or with AI</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => openPlan(plan.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') openPlan(plan.id) }}
                className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${courseColor(plan.course.id)} rounded-l-2xl`} />
                <div className="pl-6 pr-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {new Date(plan.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
                          {plan.course.code}
                        </span>
                        {plan.class && (
                          <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                            {plan.class.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">⏱ {plan.duration} min</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{plan.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{plan.objectives}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-3 py-1.5 bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-700 rounded-lg transition-colors font-medium">
                        Details →
                      </span>
                      <button
                        type="button"
                        onClick={e => handleDelete(e, plan.id)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Worksheet Builder Toggle ──────────────────────────────────── */}
        <div className="mt-10 print:hidden">
          <button
            onClick={() => setShowWorksheet(s => !s)}
            className={`w-full rounded-2xl border-2 transition-all duration-300 overflow-hidden text-left ${
              showWorksheet
                ? 'border-amber-400 bg-amber-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
            }`}
          >
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <span className="text-white text-lg">📝</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">Worksheet Oluştur</h2>
                  <p className="text-xs text-gray-500 truncate">Ders planlarınızdan öğrenci çalışma kağıdı üretin</p>
                </div>
              </div>
              <span className={`text-2xl text-amber-600 transition-transform duration-300 ${showWorksheet ? 'rotate-180' : ''}`}>⌄</span>
            </div>
          </button>
        </div>

        {/* ── Worksheet Builder Card (collapsible) ──────────────────────── */}
        <div
          className={`overflow-hidden transition-all duration-300 print:hidden ${
            showWorksheet ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="px-6 py-6 space-y-5">
            {/* Plan dropdown */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Ders Planı <span className="text-red-500">*</span></label>
              <select
                className="input-field"
                value={wsPlanId}
                onChange={e => setWsPlanId(e.target.value)}
              >
                <option value="">Ders planı seçin...</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.course.code}{p.class ? ` · ${p.class.name}` : ''} ({new Date(p.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })})
                  </option>
                ))}
              </select>
              {plans.length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5">Önce bir ders planı oluşturun.</p>
              )}
            </div>

            {/* Types */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Worksheet Tipi <span className="text-red-500">*</span></label>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {[
                  { value: 'practice', label: 'Alıştırma Soruları', icon: '✏️' },
                  { value: 'activity', label: 'Etkinlik Sayfası',   icon: '🎯' },
                  { value: 'reading',  label: 'Okuma Metni + Sorular', icon: '📖' },
                  { value: 'notes',    label: 'Not Alma Şablonu',   icon: '📓' },
                ].map(t => (
                  <label
                    key={t.value}
                    className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      wsTypes.includes(t.value)
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={wsTypes.includes(t.value)}
                      onChange={() => toggleWsType(t.value)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language + count */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Dil</label>
                <div className="flex gap-2">
                  {[{ v: 'tr', label: 'Türkçe' }, { v: 'en', label: 'İngilizce' }].map(l => (
                    <label
                      key={l.v}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer text-sm font-medium transition-all ${
                        wsLanguage === l.v ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ws-language"
                        value={l.v}
                        checked={wsLanguage === l.v}
                        onChange={() => setWsLanguage(l.v as 'tr' | 'en')}
                        className="accent-amber-500"
                      />
                      {l.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Soru Sayısı (alıştırma)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="input-field"
                  value={wsQuestionCount}
                  onChange={e => setWsQuestionCount(Math.min(Math.max(Number(e.target.value) || 1, 1), 20))}
                />
              </div>
            </div>

            {wsError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <span className="text-red-500 mt-0.5">⚠</span>
                <span>{wsError}</span>
              </div>
            )}

            <button
              onClick={generateWorksheet}
              disabled={wsGenerating || !wsPlanId || wsTypes.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {wsGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Worksheet oluşturuluyor…
                </>
              ) : (
                <>✨ Worksheet Oluştur</>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">Günlük limit: 10 worksheet / öğretmen</p>
            </div>
          </div>
        </div>

        {/* ── Worksheet Result ──────────────────────────────────────────── */}
        {worksheet && (
          <div className="mt-6">
            <WorksheetView
              meta={{
                title: worksheetMeta?.title || worksheetMeta?.unitName || 'Worksheet',
                topic: worksheetMeta?.unitName,
                courseCode: worksheetMeta?.courseCode,
                courseName: worksheetMeta?.courseName,
                grade: worksheetMeta?.grade,
                curriculum: worksheetMeta?.curriculumType,
                language: worksheetMeta?.language,
              }}
              content={worksheet}
              toolbar={
                <>
                  <button
                    onClick={() => downloadPdf(`${(worksheetMeta?.title || 'worksheet').replace(/[^a-z0-9-_çğıöşüÇĞİÖŞÜ ]/gi, '').slice(0, 60)}-${new Date().toISOString().slice(0, 10)}.pdf`)}
                    disabled={pdfDownloading}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {pdfDownloading ? 'İndiriliyor…' : '📥 PDF İndir'}
                  </button>
                  <button onClick={printWorksheet} className="btn-secondary text-sm">🖨️ Yazdır</button>
                  {worksheetId && (
                    <button onClick={() => router.push(`/teacher/worksheets/${worksheetId}`)} className="btn-secondary text-sm">🔗 Aç</button>
                  )}
                  <button onClick={() => { setWorksheet(null); setWorksheetMeta(null); setWorksheetId(null) }} className="btn-secondary text-sm">✕ Kapat</button>
                </>
              }
            />
          </div>
        )}

        {/* ── Saved Worksheets ──────────────────────────────────────────── */}
        <div className="mt-10 print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-bold text-gray-900">Kaydedilen Worksheet'ler</h2>
            {savedWorksheets.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{savedWorksheets.length}</span>
            )}
          </div>
          {savedLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            </div>
          ) : savedWorksheets.length === 0 ? (
            <div className="rounded-2xl bg-white border border-dashed border-gray-200 p-8 text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm text-gray-500">Henüz kaydedilmiş worksheet yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedWorksheets.map(ws => (
                <div
                  key={ws.id}
                  onClick={() => router.push(`/teacher/worksheets/${ws.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') router.push(`/teacher/worksheets/${ws.id}`) }}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-2xl" />
                  <div className="pl-6 pr-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">{ws.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {ws.lessonPlan?.course && (
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
                            {ws.lessonPlan.course.code}
                          </span>
                        )}
                        {ws.lessonPlan?.class && (
                          <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                            {ws.lessonPlan.class.name}
                          </span>
                        )}
                        {ws.grade && (
                          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                            {ws.grade}. Sınıf
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(ws.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {ws.language === 'tr' ? 'TR' : 'EN'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={e => handlePdfFromList(e, ws)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 rounded-lg transition-colors font-medium"
                      >
                        👁 Görüntüle
                      </button>
                      <button
                        type="button"
                        onClick={e => handleDeleteWorksheet(e, ws.id)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
