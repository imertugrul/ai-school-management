'use client'

import { useEffect, useState } from 'react'
import { useChild } from '@/context/ChildContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Bulletin {
  id: string; month: string; sentAt: string | null; gradeAverage: number | null
  gradeDetails: { courseId: string; courseName: string; average: number }[] | null
  attendancePresent: number; attendanceAbsent: number; attendanceLate: number
  participationRating: number | null; behaviorRating: number | null; homeworkRating: number | null
  strengthAreas: string | null; improvementAreas: string | null; teacherComment: string | null
  teacher: { name: string }
}

function Stars({ n, notRatedText }: { n: number | null; notRatedText: string }) {
  if (n === null) return <span className="text-gray-300 text-sm">{notRatedText}</span>
  return (
    <span className="text-base">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < n ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

function monthDisplay(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

export default function ParentBulletins() {
  const { selectedChild, loading: childLoading } = useChild()
  const { t } = useLanguage()
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [selected, setSelected]   = useState<Bulletin | null>(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (!selectedChild) return
    setLoading(true); setBulletins([]); setSelected(null)
    fetch(`/api/parent/children/${selectedChild.id}/bulletins`)
      .then(r => r.json())
      .then(d => {
        const list = d.bulletins ?? []
        setBulletins(list)
        if (list.length > 0) setSelected(list[0])
      })
      .catch(console.error).finally(() => setLoading(false))
  }, [selectedChild?.id])

  if (childLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('dashboard.parent.bulletinsTitle')}</h1>
        <p className="text-sm text-gray-400">{selectedChild?.name}</p>
      </div>

      {bulletins.length === 0 ? (
        <div className="text-center py-16"><div className="text-4xl mb-3">📋</div><p className="text-gray-500 text-sm">{t('dashboard.parent.noBulletins')}</p></div>
      ) : (
        <>
          {/* Month tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {bulletins.map(b => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  selected?.id === b.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {monthDisplay(b.month)}
              </button>
            ))}
          </div>

          {/* Bulletin detail */}
          {selected && (
            <div className="space-y-3">
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                <p className="text-xs text-blue-200 mb-1">{monthDisplay(selected.month)} {t('dashboard.parent.perfBulletin')}</p>
                <h2 className="text-xl font-bold">{selectedChild?.name}</h2>
                <p className="text-blue-100 text-sm mt-1">{selectedChild?.className}</p>
                {selected.gradeAverage !== null && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
                    <span className="text-lg font-bold">{selected.gradeAverage}</span>
                    <span className="text-sm text-blue-100">{t('dashboard.parent.generalAverage')}</span>
                  </div>
                )}
              </div>

              {/* Attendance */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">{t('dashboard.parent.attendanceSection')}</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-green-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-green-600">{selected.attendancePresent}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.parent.presentLabel')}</p>
                  </div>
                  <div className="text-center bg-red-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-red-600">{selected.attendanceAbsent}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.parent.absentLabel')}</p>
                  </div>
                  <div className="text-center bg-amber-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-amber-600">{selected.attendanceLate}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.parent.lateLabel')}</p>
                  </div>
                </div>
              </div>

              {/* Grade details */}
              {selected.gradeDetails && selected.gradeDetails.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50"><h3 className="font-semibold text-gray-900 text-sm">{t('dashboard.parent.courseGrades')}</h3></div>
                  {selected.gradeDetails.map((g, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{g.courseName}</p>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${g.average >= 85 ? 'bg-green-500' : g.average >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(g.average, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-base font-bold ${g.average >= 85 ? 'text-green-600' : g.average >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {g.average}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Teacher ratings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">{t('dashboard.parent.teacherEval')}</h3>
                <div className="space-y-2.5">
                  {[
                    { label: t('dashboard.parent.participationLabel'), value: selected.participationRating },
                    { label: t('dashboard.parent.behaviorLabel'),      value: selected.behaviorRating },
                    { label: t('dashboard.parent.homeworkLabel'),      value: selected.homeworkRating },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{row.label}</span>
                      <Stars n={row.value} notRatedText={t('dashboard.parent.notRated')} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Strength / improvement */}
              {(selected.strengthAreas || selected.improvementAreas) && (
                <div className="grid grid-cols-1 gap-3">
                  {selected.strengthAreas && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-green-700 mb-1">{t('dashboard.parent.strengths')}</p>
                      <p className="text-sm text-gray-700">{selected.strengthAreas}</p>
                    </div>
                  )}
                  {selected.improvementAreas && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-amber-700 mb-1">{t('dashboard.parent.improvements')}</p>
                      <p className="text-sm text-gray-700">{selected.improvementAreas}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Teacher comment */}
              {selected.teacherComment && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">{t('dashboard.parent.teacherComment')}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.teacherComment}</p>
                  <p className="text-xs text-gray-400 mt-2">— {selected.teacher.name}</p>
                </div>
              )}

              {selected.sentAt && (
                <p className="text-xs text-center text-gray-400">
                  {new Date(selected.sentAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} {t('dashboard.parent.sentOn')}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
