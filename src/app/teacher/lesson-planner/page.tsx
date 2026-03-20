'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course { id: string; code: string; name: string; grade: string | null }
interface ClassItem { id: string; name: string }
interface SlideItem { slide: number; title: string; duration: number; content: string[]; notes: string }
interface ActivityItem { name: string; duration: number; description: string; grouping: string }
interface Assessment { formative: string[]; summative: string[]; exitTicket: string }
interface GeneratedPlan {
  id: string
  courseName: string
  courseCode: string
  curriculumType: string
  unitName: string
  duration: number
  learningObjectives: string[]
  materialsNeeded: string[]
  slideOutline: SlideItem[]
  activities: ActivityItem[]
  assessment: Assessment
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRICULUM_TYPES = [
  { value: 'IB',          label: 'IB',          full: 'International Baccalaureate', desc: 'Inquiry-based, conceptual learning', color: 'border-blue-400 bg-blue-50' },
  { value: 'AP',          label: 'AP',           full: 'Advanced Placement',          desc: 'College-level rigor, exam prep',    color: 'border-purple-400 bg-purple-50' },
  { value: 'NATIONAL',    label: 'National',     full: 'Milli Müfredat (MEB)',         desc: 'Turkish national curriculum',      color: 'border-red-400 bg-red-50' },
  { value: 'IGCSE',       label: 'IGCSE',        full: 'International GCSE',           desc: 'Cambridge curriculum',             color: 'border-green-400 bg-green-50' },
  { value: 'COMMON_CORE', label: 'Common Core',  full: 'US Common Core',               desc: 'College & career readiness',       color: 'border-orange-400 bg-orange-50' },
]

const LOADING_STEPS = [
  'Analyzing curriculum standards...',
  'Identifying learning objectives...',
  'Creating activity suggestions...',
  'Designing assessment strategies...',
  'Writing slide outline...',
  'Finalizing lesson plan...',
]

const GROUPING_COLORS: Record<string, string> = {
  individual:   'bg-blue-100 text-blue-700',
  pairs:        'bg-green-100 text-green-700',
  groups:       'bg-purple-100 text-purple-700',
  'whole-class':'bg-orange-100 text-orange-700',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LessonPlannerPage() {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  // Step
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input')

  // Form
  const [form, setForm] = useState({ curriculumType: '', courseId: '', classId: '', unitName: '', duration: '45' })
  const [courses, setCourses] = useState<Course[]>([])
  const [classes, setClasses]  = useState<ClassItem[]>([])
  const [error, setError] = useState('')

  // Loading animation
  const [loadingStep, setLoadingStep] = useState(0)
  const [doneSteps, setDoneSteps]  = useState<number[]>([])

  // Result
  const [plan, setPlan]   = useState<GeneratedPlan | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Editable fields
  const [editObjectives,  setEditObjectives]  = useState<string[]>([])
  const [editMaterials,   setEditMaterials]   = useState<string[]>([])
  const [editSlides,      setEditSlides]      = useState<SlideItem[]>([])
  const [editActivities,  setEditActivities]  = useState<ActivityItem[]>([])
  const [editAssessment,  setEditAssessment]  = useState<Assessment>({ formative: [], summative: [], exitTicket: '' })
  const [editNotes,       setEditNotes]       = useState('')
  const [editHomework,    setEditHomework]    = useState('')

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/teacher/courses').then(r => r.json()).then(d => { if (d.success) setCourses(d.courses) })
    fetch('/api/teacher/classes').then(r => r.json()).then(d => { if (d.success) setClasses(d.classes) })
  }, [])

  // ── Loading animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'generating') return
    setLoadingStep(0)
    setDoneSteps([])
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        const next = prev + 1
        setDoneSteps(d => [...d, prev])
        if (next >= LOADING_STEPS.length) clearInterval(interval)
        return next
      })
    }, 2200)
    return () => clearInterval(interval)
  }, [step])

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.curriculumType) { setError('Please select a curriculum type.'); return }
    setError('')
    setStep('generating')

    try {
      const res = await fetch('/api/teacher/lesson-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration: parseInt(form.duration) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate')

      setPlan(data.lessonPlan)
      // Seed editable state
      setEditObjectives(data.lessonPlan.learningObjectives)
      setEditMaterials(data.lessonPlan.materialsNeeded)
      setEditSlides(data.lessonPlan.slideOutline)
      setEditActivities(data.lessonPlan.activities)
      setEditAssessment(data.lessonPlan.assessment)
      setEditNotes('')
      setEditHomework('')
      setSaved(false)
      setEditing(false)
      setStep('result')
    } catch (err: any) {
      setError(err.message)
      setStep('input')
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!plan) return
    setSaving(true)
    const res = await fetch(`/api/teacher/lesson-plans/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learningObjectives: JSON.stringify(editObjectives),
        materialsNeeded:    JSON.stringify(editMaterials),
        slideOutline:       JSON.stringify(editSlides),
        aiActivities:       JSON.stringify(editActivities),
        aiAssessment:       JSON.stringify(editAssessment),
        teacherNotes:       editNotes || null,
        homework:           editHomework || null,
        wasEdited:          true,
      })
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) { setSaved(true); setEditing(false) }
  }

  // ── Print/PDF ────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print()

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const updateListItem = (list: string[], setList: (v: string[]) => void, i: number, val: string) => {
    const updated = [...list]; updated[i] = val; setList(updated)
  }
  const addListItem   = (list: string[], setList: (v: string[]) => void) => setList([...list, ''])
  const removeListItem = (list: string[], setList: (v: string[]) => void, i: number) => setList(list.filter((_, idx) => idx !== i))

  const curriculumInfo = CURRICULUM_TYPES.find(c => c.value === plan?.curriculumType)

  // ────────────────────────────────────────────────────────────────────────────
  // STEP: GENERATING
  // ────────────────────────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40 animate-pulse">
              <span className="text-4xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Creating Your Lesson Plan</h2>
            <p className="text-gray-500 text-sm">Claude AI is generating a comprehensive plan for <span className="font-semibold text-purple-700">"{form.unitName}"</span></p>
          </div>

          <div className="space-y-3 mb-8">
            {LOADING_STEPS.map((label, i) => {
              const isDone    = doneSteps.includes(i)
              const isActive  = loadingStep === i
              const isPending = loadingStep < i
              return (
                <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-100' : isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    {isDone    && <span className="text-emerald-600 text-xs">✓</span>}
                    {isActive  && <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />}
                    {isPending && <span className="text-gray-300 text-xs">○</span>}
                  </div>
                  <span className={isDone ? 'text-gray-500 line-through' : isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, ((doneSteps.length) / LOADING_STEPS.length) * 100)}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">This usually takes 10–20 seconds</p>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP: RESULT
  // ────────────────────────────────────────────────────────────────────────────
  if (step === 'result' && plan) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 print:hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">{plan.unitName}</h1>
                  <p className="text-xs text-gray-500">{plan.courseCode} · {curriculumInfo?.full || plan.curriculumType} · {plan.duration} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="btn-secondary text-sm">✏️ Edit</button>
                ) : (
                  <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
                )}
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : saved ? '✓ Saved' : '💾 Save'}
                </button>
                <button onClick={handlePrint} className="btn-secondary text-sm hidden md:inline-flex">🖨️ Print / PDF</button>
                <button onClick={() => setStep('input')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                  ← New
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Print header (hidden on screen) */}
        <div className="hidden print:block px-8 pt-8 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-bold">{plan.unitName}</h1>
          <p className="text-sm text-gray-600">{plan.courseCode} – {plan.courseName} · {curriculumInfo?.full || plan.curriculumType} · {plan.duration} min</p>
        </div>

        <div ref={printRef} className="max-w-4xl mx-auto px-4 py-8 space-y-6">

          {/* ── 1. Learning Objectives ──────────────────────────────────────── */}
          <Section icon="📚" title="Learning Objectives" color="blue">
            {editing ? (
              <EditableList items={editObjectives} setItems={setEditObjectives} placeholder="Students will be able to..." />
            ) : (
              <ul className="space-y-2">
                {editObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    {obj}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── 2. Materials ─────────────────────────────────────────────────── */}
          <Section icon="🛠️" title="Materials Needed" color="emerald">
            {editing ? (
              <EditableList items={editMaterials} setItems={setEditMaterials} placeholder="Add material..." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {editMaterials.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium">
                    ✓ {m}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* ── 3. Slide Outline ─────────────────────────────────────────────── */}
          <Section icon="📊" title="Slide Outline" color="violet">
            <div className="space-y-3">
              {editSlides.map((slide, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 border-b border-violet-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-violet-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">{slide.slide}</span>
                      {editing ? (
                        <input
                          className="font-semibold text-sm text-gray-900 bg-transparent border-b border-violet-300 focus:outline-none w-48"
                          value={slide.title}
                          onChange={e => { const s=[...editSlides]; s[i]={...s[i],title:e.target.value}; setEditSlides(s) }}
                        />
                      ) : (
                        <span className="font-semibold text-sm text-gray-900">{slide.title}</span>
                      )}
                    </div>
                    <span className="text-xs text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full font-medium">⏱ {slide.duration} min</span>
                  </div>
                  <div className="px-4 py-3">
                    {editing ? (
                      <textarea
                        className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none resize-none"
                        rows={3}
                        value={slide.content.join('\n')}
                        onChange={e => { const s=[...editSlides]; s[i]={...s[i],content:e.target.value.split('\n')}; setEditSlides(s) }}
                      />
                    ) : (
                      <ul className="space-y-1">
                        {slide.content.map((point, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-violet-400 mt-0.5">→</span>{point}
                          </li>
                        ))}
                      </ul>
                    )}
                    {slide.notes && !editing && (
                      <p className="mt-2 text-xs text-gray-400 italic">💡 {slide.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 4. Activities ─────────────────────────────────────────────────── */}
          <Section icon="🎯" title="Activities" color="orange">
            <div className="space-y-4">
              {editActivities.map((act, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900 text-sm">{act.name}</span>
                    <span className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full font-medium">⏱ {act.duration} min</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${GROUPING_COLORS[act.grouping] || 'bg-gray-100 text-gray-600'}`}>
                      {act.grouping}
                    </span>
                  </div>
                  {editing ? (
                    <textarea
                      className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                      rows={3}
                      value={act.description}
                      onChange={e => { const a=[...editActivities]; a[i]={...a[i],description:e.target.value}; setEditActivities(a) }}
                    />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">{act.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* ── 5. Assessment ─────────────────────────────────────────────────── */}
          <Section icon="✅" title="Assessment" color="green">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Formative (During Lesson)</p>
                {editing ? (
                  <EditableList items={editAssessment.formative} setItems={v => setEditAssessment(a=>({...a,formative:v}))} placeholder="Add strategy..." />
                ) : (
                  <ul className="space-y-1.5">
                    {editAssessment.formative.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5 shrink-0">●</span>{f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Summative (After Lesson)</p>
                {editing ? (
                  <EditableList items={editAssessment.summative} setItems={v => setEditAssessment(a=>({...a,summative:v}))} placeholder="Add assessment..." />
                ) : (
                  <ul className="space-y-1.5">
                    {editAssessment.summative.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-0.5 shrink-0">●</span>{s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Exit Ticket</p>
                {editing ? (
                  <textarea
                    className="w-full text-sm bg-gray-50 rounded-xl p-3 border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none resize-none"
                    rows={2}
                    value={editAssessment.exitTicket}
                    onChange={e => setEditAssessment(a=>({...a,exitTicket:e.target.value}))}
                  />
                ) : (
                  <p className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-xl p-3">{editAssessment.exitTicket}</p>
                )}
              </div>
            </div>
          </Section>

          {/* ── 6. Teacher Notes (Optional) ──────────────────────────────────── */}
          <Section icon="📝" title="Teacher Notes" color="gray" optional>
            <textarea
              className="w-full text-sm bg-gray-50 rounded-xl p-3 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none resize-y min-h-[80px]"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Add personal notes, reminders, or adjustments for this class..."
            />
          </Section>

          {/* ── 7. Homework (Optional) ───────────────────────────────────────── */}
          <Section icon="📚" title="Homework Assignment" color="gray" optional>
            <textarea
              className="w-full text-sm bg-gray-50 rounded-xl p-3 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none resize-y min-h-[80px]"
              value={editHomework}
              onChange={e => setEditHomework(e.target.value)}
              placeholder="Describe the homework assignment..."
            />
          </Section>

          {/* ── Bottom action bar ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 pt-2 print:hidden">
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50 flex-1 md:flex-none">
              {saving ? 'Saving...' : saved ? '✓ Plan Saved!' : '💾 Save Lesson Plan'}
            </button>
            <button onClick={handlePrint} className="btn-secondary flex-1 md:flex-none">🖨️ Print / Export PDF</button>
            <button onClick={() => { setStep('input'); setPlan(null) }} className="btn-secondary flex-1 md:flex-none">🤖 Generate Another</button>
            <button onClick={() => router.push('/teacher/lesson-plans')} className="btn-secondary flex-1 md:flex-none">📋 View All Plans</button>
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP: INPUT FORM
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🤖</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Lesson Planner</h1>
                <p className="text-xs text-gray-500">Generate a full lesson plan in seconds</p>
              </div>
            </div>
            <button onClick={() => router.push('/teacher/lesson-plans')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              ← Lesson Plans
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-4">
            <span className="animate-pulse">●</span> Powered by Claude AI
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Generate Your Lesson Plan</h2>
          <p className="text-gray-500">Select your curriculum and topic — AI creates a complete, ready-to-use lesson plan in under 20 seconds.</p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 md:p-8">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
              <span className="text-red-500 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-8">

            {/* 1. Curriculum Type */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                1. Curriculum Type <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2.5">
                {CURRICULUM_TYPES.map(ct => (
                  <label
                    key={ct.value}
                    className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      form.curriculumType === ct.value
                        ? ct.color + ' border-opacity-100 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="curriculumType"
                      value={ct.value}
                      checked={form.curriculumType === ct.value}
                      onChange={e => setForm(f => ({ ...f, curriculumType: e.target.value }))}
                      className="mt-1 accent-violet-600"
                    />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{ct.full}
                        <span className="ml-2 text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{ct.label}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{ct.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. Course */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                2. Course <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input-field"
                value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              >
                <option value="">Choose a course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} – {c.name}{c.grade ? ` (Grade ${c.grade})` : ''}</option>
                ))}
              </select>
            </div>

            {/* 3. Unit / Topic */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                3. Unit / Topic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder={`e.g. "Quadratic Equations", "Newton's Laws of Motion", "The French Revolution"`}
                value={form.unitName}
                onChange={e => setForm(f => ({ ...f, unitName: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1.5">Be specific — better topic = better lesson plan</p>
            </div>

            {/* 4 & 5 in a row */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">4. Class <span className="text-gray-400 font-normal">(optional)</span></label>
                <select className="input-field" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                  <option value="">No specific class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">5. Duration <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="30" max="120" step="5"
                    className="input-field w-24"
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  />
                  <span className="text-gray-500 text-sm font-medium">minutes</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!form.curriculumType || !form.courseId || !form.unitName}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              <span className="text-xl">🤖</span>
              Generate Lesson Plan with AI
            </button>

            <p className="text-center text-xs text-gray-400">
              AI will generate learning objectives, materials, slide outline, activities, and assessment strategies
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function Section({
  icon, title, color, children, optional
}: {
  icon: string
  title: string
  color: string
  children: React.ReactNode
  optional?: boolean
}) {
  const borderColors: Record<string, string> = {
    blue:   'border-l-blue-500',
    emerald:'border-l-emerald-500',
    violet: 'border-l-violet-500',
    orange: 'border-l-orange-500',
    green:  'border-l-green-500',
    gray:   'border-l-gray-300',
  }
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-6 py-4 border-l-4 ${borderColors[color] || 'border-l-gray-300'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{icon}</span>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {optional && <span className="text-xs text-gray-400 font-normal">(optional)</span>}
        </div>
        {children}
      </div>
    </div>
  )
}

function EditableList({
  items, setItems, placeholder
}: {
  items: string[]
  setItems: (v: string[]) => void
  placeholder: string
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="input-field flex-1 text-sm py-2"
            value={item}
            onChange={e => { const updated = [...items]; updated[i] = e.target.value; setItems(updated) }}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => setItems(items.filter((_, idx) => idx !== i))}
            className="px-2 text-gray-300 hover:text-red-500 transition-colors"
          >✕</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, ''])}
        className="text-xs text-gray-400 hover:text-gray-700 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
      >+ Add item</button>
    </div>
  )
}
