'use client'

import { useEffect, useState } from 'react'
import { useChild } from '@/context/ChildContext'

interface GradeComponent {
  id: string; name: string; type: string; weight: number
  maxScore: number; date: string | null
  score: number | null; percentage: number | null; feedback: string | null
}
interface Course {
  id: string; name: string; subject: string
  average: number | null; components: GradeComponent[]
}

function letterGrade(avg: number | null) {
  if (avg === null) return '—'
  if (avg >= 90) return 'A+'; if (avg >= 85) return 'A'; if (avg >= 80) return 'B+'
  if (avg >= 75) return 'B';  if (avg >= 70) return 'C+'; if (avg >= 65) return 'C'
  if (avg >= 60) return 'D'; return 'F'
}
function barColor(pct: number | null) {
  if (pct === null) return 'bg-gray-200'
  if (pct >= 85) return 'bg-green-500'; if (pct >= 70) return 'bg-amber-400'; return 'bg-red-400'
}
function textColor(avg: number | null) {
  if (avg === null) return 'text-gray-400'
  if (avg >= 85) return 'text-green-600'; if (avg >= 70) return 'text-amber-600'; return 'text-red-600'
}
const TYPE_LABELS: Record<string, string> = {
  EXAM: 'Exam', QUIZ: 'Quiz', HOMEWORK: 'Assignment',
  PROJECT: 'Project', PARTICIPATION: 'Participation', ATTENDANCE: 'Attendance',
}

export default function ParentGrades() {
  const { selectedChild, loading: childLoading } = useChild()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedChild) return
    setLoading(true); setCourses([])
    fetch(`/api/parent/children/${selectedChild.id}/grades`)
      .then(r => r.json()).then(d => setCourses(d.courses ?? []))
      .catch(console.error).finally(() => setLoading(false))
  }, [selectedChild?.id])

  const withAvg    = courses.filter(c => c.average !== null)
  const overallAvg = withAvg.length > 0
    ? Math.round(withAvg.reduce((s, c) => s + c.average!, 0) / withAvg.length * 10) / 10
    : null

  if (childLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Grade Tracker</h1>
        <p className="text-sm text-gray-400">{selectedChild?.name}</p>
      </div>

      {overallAvg !== null && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white flex items-center gap-4">
          <div>
            <p className="text-xs text-indigo-200">Overall Average</p>
            <p className="text-4xl font-bold">{overallAvg}</p>
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-3xl font-bold">{letterGrade(overallAvg)}</p>
            <p className="text-xs text-indigo-200">{withAvg.length} subject{withAvg.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-16"><div className="text-4xl mb-3">📊</div><p className="text-gray-500 text-sm">No grades entered yet.</p></div>
      ) : courses.map(course => (
        <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">{course.name}</h3>
              <p className="text-xs text-gray-400">{course.subject}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${textColor(course.average)}`}>{course.average ?? '—'}</p>
              <p className="text-xs text-gray-400">{letterGrade(course.average)}</p>
            </div>
          </div>

          {course.average !== null && (
            <div className="px-4 pt-3 pb-1">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor(course.average)}`} style={{ width: `${Math.min(course.average, 100)}%` }} />
              </div>
            </div>
          )}

          <div className="px-4 py-3 space-y-3">
            {course.components.map(comp => (
              <div key={comp.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-700 truncate">{comp.name}</span>
                    <span className="text-xs text-gray-400">{TYPE_LABELS[comp.type] ?? comp.type}</span>
                    <span className="text-xs text-blue-400">%{Math.round(comp.weight * 100)}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    {comp.percentage !== null
                      ? <div className={`h-full rounded-full ${barColor(comp.percentage)}`} style={{ width: `${Math.min(comp.percentage, 100)}%` }} />
                      : <div className="h-full bg-gray-200 rounded-full w-full" />
                    }
                  </div>
                </div>
                <div className="text-right shrink-0 w-16">
                  {comp.score !== null
                    ? <p className={`text-sm font-bold ${textColor(comp.percentage)}`}>{comp.score}/{comp.maxScore}</p>
                    : <p className="text-xs text-gray-300">Not entered</p>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
