'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [wsPlanId, setWsPlanId] = useState('')
  const [wsTypes, setWsTypes] = useState<string[]>(['practice'])
  const [wsLanguage, setWsLanguage] = useState<'tr' | 'en'>('tr')
  const [wsQuestionCount, setWsQuestionCount] = useState(5)
  const [wsGenerating, setWsGenerating] = useState(false)
  const [wsError, setWsError] = useState('')
  const [worksheet, setWorksheet] = useState<any>(null)
  const [worksheetMeta, setWorksheetMeta] = useState<any>(null)

  const toggleWsType = (t: string) => {
    setWsTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const generateWorksheet = async () => {
    if (!wsPlanId) { setWsError('Önce bir ders planı seçin.'); return }
    if (wsTypes.length === 0) { setWsError('En az bir worksheet tipi seçin.'); return }
    setWsError(''); setWsGenerating(true); setWorksheet(null); setWorksheetMeta(null)
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
    } catch (err: any) {
      setWsError(err.message)
    } finally {
      setWsGenerating(false)
    }
  }

  const printWorksheet = () => window.print()

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

        {/* ── Worksheet Builder ─────────────────────────────────────────── */}
        <div className="mt-10 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden print:hidden">
          <div className="px-6 py-5 border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/40 to-transparent">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                <span className="text-white text-lg">📝</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Worksheet Oluştur</h2>
                <p className="text-xs text-gray-500">Ders planlarınızdan öğrenci çalışma kağıdı üretin</p>
              </div>
            </div>
          </div>

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

        {/* ── Worksheet Result ──────────────────────────────────────────── */}
        {worksheet && (
          <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {/* Print header (hidden on screen) */}
            <div className="hidden print:block px-8 pt-8 pb-4 border-b border-gray-300">
              <h1 className="text-2xl font-bold">{worksheetMeta?.unitName || 'Worksheet'}</h1>
              <p className="text-sm text-gray-600">
                {worksheetMeta?.courseCode} – {worksheetMeta?.courseName}
                {worksheetMeta?.grade && <> · Sınıf: {worksheetMeta.grade}</>}
              </p>
              <div className="flex gap-8 mt-4 text-sm">
                <div>Öğrenci Adı: <span className="inline-block w-64 border-b border-gray-400" /></div>
                <div>Tarih: <span className="inline-block w-32 border-b border-gray-400" /></div>
              </div>
            </div>

            <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow">
                  <span className="text-white text-lg">📄</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">{worksheetMeta?.unitName || 'Worksheet'}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {worksheetMeta?.courseCode} · {worksheetMeta?.language === 'tr' ? 'Türkçe' : 'İngilizce'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={printWorksheet} className="btn-secondary text-sm">📄 PDF / Yazdır</button>
                <button onClick={() => { setWorksheet(null); setWorksheetMeta(null) }} className="btn-secondary text-sm">✕ Kapat</button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-8">
              {/* Practice */}
              {worksheet.practice?.questions?.length > 0 && (
                <WorksheetSection icon="✏️" title="Alıştırma Soruları">
                  <ol className="space-y-4 list-decimal list-inside">
                    {worksheet.practice.questions.map((q: any, i: number) => (
                      <li key={i} className="text-sm text-gray-800">
                        <span className="font-medium">{q.question}</span>
                        {q.type === 'mcq' && Array.isArray(q.options) && (
                          <ul className="mt-2 ml-6 space-y-1.5">
                            {q.options.map((opt: string, j: number) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="w-5 h-5 border border-gray-400 rounded-full inline-block shrink-0 mt-0.5" />
                                <span>{String.fromCharCode(65 + j)}) {opt}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {q.type === 'short' && (
                          <div className="mt-2 ml-6 border-b border-gray-300 h-8" />
                        )}
                        {q.type === 'truefalse' && (
                          <div className="mt-2 ml-6 flex gap-6 text-sm text-gray-700">
                            <span className="flex items-center gap-2"><span className="w-4 h-4 border border-gray-400 rounded inline-block" /> Doğru</span>
                            <span className="flex items-center gap-2"><span className="w-4 h-4 border border-gray-400 rounded inline-block" /> Yanlış</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </WorksheetSection>
              )}

              {/* Activity */}
              {worksheet.activity?.activities?.length > 0 && (
                <WorksheetSection icon="🎯" title="Etkinlikler">
                  <div className="space-y-4">
                    {worksheet.activity.activities.map((a: any, i: number) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-4 print:break-inside-avoid">
                        <h4 className="font-bold text-sm text-gray-900 mb-1">{a.title}</h4>
                        <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{a.instructions}</p>
                        <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 min-h-[80px] text-xs text-gray-400 italic whitespace-pre-line">
                          {a.studentSpace || 'Öğrenci için boşluk'}
                        </div>
                      </div>
                    ))}
                  </div>
                </WorksheetSection>
              )}

              {/* Reading */}
              {worksheet.reading?.text && (
                <WorksheetSection icon="📖" title="Okuma Metni">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 border border-gray-200 print:break-inside-avoid">
                    {worksheet.reading.text}
                  </p>
                  {worksheet.reading.questions?.length > 0 && (
                    <ol className="mt-4 space-y-3 list-decimal list-inside">
                      {worksheet.reading.questions.map((q: any, i: number) => (
                        <li key={i} className="text-sm text-gray-800">
                          <span className="font-medium">{q.question}</span>
                          <div className="mt-2 ml-6 border-b border-gray-300 h-8" />
                        </li>
                      ))}
                    </ol>
                  )}
                </WorksheetSection>
              )}

              {/* Notes */}
              {worksheet.notes?.sections?.length > 0 && (
                <WorksheetSection icon="📓" title="Not Alma Şablonu">
                  <div className="space-y-4">
                    {worksheet.notes.sections.map((s: any, i: number) => (
                      <div key={i} className="print:break-inside-avoid">
                        <h4 className="font-bold text-sm text-gray-900 mb-2">{s.title}</h4>
                        <div className="space-y-1">
                          {Array.from({ length: Math.max(1, Math.min(s.lines ?? 4, 12)) }).map((_, j) => (
                            <div key={j} className="border-b border-gray-300 h-6" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </WorksheetSection>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function WorksheetSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="print:break-inside-avoid">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
        <span className="text-lg">{icon}</span>
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  )
}
