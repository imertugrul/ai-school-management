'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface GradeComponent {
  id: string
  name: string
  type: string
  weight: number
  maxScore: number
  date: string | null
  score: number | null
  feedback: string | null
}

interface CourseGrades {
  courseId: string
  courseName: string
  courseCode: string
  average: number | null
  components: GradeComponent[]
}

interface Child { id: string; name: string }

function ParentGradesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState(searchParams.get('studentId') || '')
  const [grades, setGrades] = useState<CourseGrades[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setChildren(data.children)
          if (!selectedChildId && data.children.length > 0) setSelectedChildId(data.children[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedChildId) return
    setLoading(true)
    fetch(`/api/parent/child/${selectedChildId}/grades`)
      .then(r => r.json())
      .then(data => { if (data.success) setGrades(data.grades) })
      .finally(() => setLoading(false))
  }, [selectedChildId])

  const getGradeColor = (pct: number) => {
    if (pct >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (pct >= 75) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (pct >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (pct >= 50) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🎓</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Grades</h1>
                <p className="text-xs text-gray-500">View your child's grades</p>
              </div>
            </div>
            <button onClick={() => router.push('/parent/dashboard')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {children.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Child</label>
            <select className="input-field max-w-xs" value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : grades.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No grades yet</h3>
            <p className="text-gray-500 text-sm">Grades will appear here once teachers enter them</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grades.map(course => (
              <div key={course.courseId} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900">{course.courseName}</h3>
                    <p className="text-sm text-gray-500">{course.courseCode}</p>
                  </div>
                  {course.average !== null && (
                    <span className={`text-xl font-bold px-4 py-1.5 rounded-xl border ${getGradeColor(course.average)}`}>
                      {course.average.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-50">
                  {course.components.map(comp => {
                    const pct = comp.score !== null && comp.maxScore > 0 ? (comp.score / comp.maxScore) * 100 : null
                    return (
                      <div key={comp.id} className="px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{comp.name}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{comp.type}</span>
                            <span className="text-xs text-gray-400">{Math.round(comp.weight * 100)}%</span>
                          </div>
                          {comp.feedback && <p className="text-xs text-gray-500 mt-0.5">{comp.feedback}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          {comp.score !== null ? (
                            <>
                              <span className={`text-sm font-bold ${pct !== null ? getGradeColor(pct).split(' ')[0] : ''}`}>
                                {comp.score}/{comp.maxScore}
                              </span>
                              {pct !== null && <p className="text-xs text-gray-400">{pct.toFixed(1)}%</p>}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Not graded</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ParentGradesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>}>
      <ParentGradesContent />
    </Suspense>
  )
}
