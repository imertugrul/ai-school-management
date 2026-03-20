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
  const [expanded, setExpanded] = useState<string | null>(null)
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson plan?')) return
    await fetch(`/api/teacher/lesson-plans/${id}`, { method: 'DELETE' })
    fetchPlans()
  }

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
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ New Plan</button>
              <button onClick={() => router.push('/teacher/dashboard')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
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
            <p className="text-gray-500 text-sm mb-6">Create your first plan for {monthLabel}</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">+ Create Plan</button>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map(plan => (
              <div key={plan.id} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
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
                      <button
                        onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-lg transition-colors font-medium"
                      >
                        {expanded === plan.id ? 'Collapse' : 'Details'}
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expanded === plan.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-4 text-sm">
                      {[
                        { label: 'Objectives', value: plan.objectives },
                        { label: 'Activities', value: plan.activities },
                        plan.materials ? { label: 'Materials', value: plan.materials } : null,
                        plan.assessment ? { label: 'Assessment', value: plan.assessment } : null,
                        plan.homework ? { label: 'Homework', value: plan.homework } : null,
                        plan.notes ? { label: 'Notes', value: plan.notes } : null,
                      ].filter(Boolean).map(item => item && (
                        <div key={item.label}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                          <p className="text-gray-700 whitespace-pre-line">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
