'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Teacher { id: string; name: string }
interface Course  { id: string; code: string; name: string }
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
  unitName: string | null
  curriculumType: string | null
  isAIGenerated: boolean
  wasEdited: boolean
  learningObjectives: string | null
  teacher: { id: string; name: string; email: string }
  course: Course
  class: { id: string; name: string } | null
}

const CURRICULUM_LABELS: Record<string, string> = {
  IB: 'IB', AP: 'AP', NATIONAL: 'National', IGCSE: 'IGCSE', COMMON_CORE: 'Common Core',
}

const COURSE_COLORS = [
  'from-blue-500 to-blue-600', 'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600', 'from-orange-500 to-orange-600',
  'from-indigo-500 to-indigo-600', 'from-rose-500 to-rose-600',
]

export default function AdminLessonPlansPage() {
  const router = useRouter()
  const [plans, setPlans]       = useState<LessonPlan[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [courses, setCourses]   = useState<Course[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const now = new Date()
  const [month,      setMonth]      = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const [teacherId,  setTeacherId]  = useState('')
  const [courseId,   setCourseId]   = useState('')

  useEffect(() => { fetchPlans() }, [month, teacherId, courseId])

  const fetchPlans = async () => {
    setLoading(true)
    const params = new URLSearchParams({ month })
    if (teacherId) params.set('teacherId', teacherId)
    if (courseId)  params.set('courseId',  courseId)
    try {
      const res  = await fetch(`/api/admin/lesson-plans?${params}`)
      const data = await res.json()
      if (data.success) {
        setPlans(data.lessonPlans)
        if (data.teachers.length) setTeachers(data.teachers)
        if (data.courses.length)  setCourses(data.courses)
      }
    } finally {
      setLoading(false)
    }
  }

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

  const uniqueCourseIds = [...new Set(plans.map(p => p.course.id))]
  const courseColor = (id: string) => COURSE_COLORS[uniqueCourseIds.indexOf(id) % COURSE_COLORS.length]

  // Group by teacher
  const byTeacher = plans.reduce<Record<string, { teacher: LessonPlan['teacher']; plans: LessonPlan[] }>>((acc, p) => {
    if (!acc[p.teacher.id]) acc[p.teacher.id] = { teacher: p.teacher, plans: [] }
    acc[p.teacher.id].plans.push(p)
    return acc
  }, {})

  const aiCount     = plans.filter(p => p.isAIGenerated).length
  const manualCount = plans.length - aiCount

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Lesson Plans</h1>
                <p className="text-xs text-gray-500">All teachers · {monthLabel}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              ← Admin
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Plans',    value: plans.length,  icon: '📋', color: 'text-gray-900' },
            { label: 'AI Generated',   value: aiCount,       icon: '🤖', color: 'text-violet-700' },
            { label: 'Manual Plans',   value: manualCount,   icon: '✏️', color: 'text-indigo-700' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Month nav */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <button onClick={prevMonth} className="text-gray-500 hover:text-gray-800 transition-colors px-1">←</button>
            <span className="text-sm font-semibold text-gray-900 min-w-[130px] text-center">{monthLabel}</span>
            <button onClick={nextMonth} className="text-gray-500 hover:text-gray-800 transition-colors px-1">→</button>
          </div>

          {/* Teacher filter */}
          <select
            className="input-field w-auto"
            value={teacherId}
            onChange={e => setTeacherId(e.target.value)}
          >
            <option value="">All Teachers</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          {/* Course filter */}
          <select
            className="input-field w-auto"
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
          </select>

          {(teacherId || courseId) && (
            <button
              onClick={() => { setTeacherId(''); setCourseId('') }}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lesson plans found</h3>
            <p className="text-gray-500 text-sm">No plans created for {monthLabel} with the current filters</p>
          </div>
        ) : teacherId ? (
          // Single teacher → flat list
          <div className="space-y-3">
            {plans.map(plan => <PlanCard key={plan.id} plan={plan} courseColor={courseColor} expanded={expanded} setExpanded={setExpanded} showTeacher={false} />)}
          </div>
        ) : (
          // All teachers → grouped
          <div className="space-y-8">
            {Object.values(byTeacher).map(({ teacher, plans: tPlans }) => (
              <div key={teacher.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(teacher.name || 'T').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-sm">{teacher.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{tPlans.length} plan{tPlans.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {tPlans.map(plan => <PlanCard key={plan.id} plan={plan} courseColor={courseColor} expanded={expanded} setExpanded={setExpanded} showTeacher={false} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlanCard({ plan, courseColor, expanded, setExpanded, showTeacher }: {
  plan: LessonPlan
  courseColor: (id: string) => string
  expanded: string | null
  setExpanded: (id: string | null) => void
  showTeacher: boolean
}) {
  const isOpen = expanded === plan.id

  // Parse AI objectives if present
  let objectives: string[] = []
  if (plan.isAIGenerated && plan.learningObjectives) {
    try { objectives = JSON.parse(plan.learningObjectives) } catch { objectives = [] }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${courseColor(plan.course.id)} rounded-l-2xl`} />
      <div className="pl-6 pr-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
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
              {plan.curriculumType && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                  {CURRICULUM_LABELS[plan.curriculumType] || plan.curriculumType}
                </span>
              )}
              {plan.isAIGenerated && (
                <span className="text-xs text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  🤖 AI{plan.wasEdited ? ' · edited' : ''}
                </span>
              )}
              <span className="text-xs text-gray-400">⏱ {plan.duration} min</span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-gray-900">
              {plan.isAIGenerated && plan.unitName ? plan.unitName : plan.title}
            </h3>
            {/* Preview text */}
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {plan.isAIGenerated && objectives.length > 0
                ? objectives[0]
                : plan.objectives}
            </p>
          </div>

          <button
            onClick={() => setExpanded(isOpen ? null : plan.id)}
            className="shrink-0 text-xs px-3 py-1.5 bg-gray-100 hover:bg-violet-100 text-gray-600 hover:text-violet-700 rounded-lg transition-colors font-medium"
          >
            {isOpen ? 'Collapse' : 'Details'}
          </button>
        </div>

        {isOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-4">
            {plan.isAIGenerated ? (
              <>
                {objectives.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Learning Objectives</p>
                    <ul className="space-y-1.5">
                      {objectives.map((o, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Objectives',  value: plan.objectives },
                  { label: 'Activities',  value: plan.activities },
                  plan.materials   ? { label: 'Materials',   value: plan.materials }   : null,
                  plan.assessment  ? { label: 'Assessment',  value: plan.assessment }  : null,
                  plan.homework    ? { label: 'Homework',    value: plan.homework }    : null,
                  plan.notes       ? { label: 'Notes',       value: plan.notes }       : null,
                ].filter(Boolean).map(item => item && (
                  <div key={item.label}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-gray-700 whitespace-pre-line text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
