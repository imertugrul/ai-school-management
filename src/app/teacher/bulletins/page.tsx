'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  name: string
  _count: { students: number }
}

interface Bulletin {
  id: string
  studentId: string
  month: string
  status: 'DRAFT' | 'READY' | 'SENT'
  attendancePresent: number
  attendanceAbsent: number
  attendanceLate: number
  gradeAverage: number | null
  participationRating: number | null
  behaviorRating: number | null
  homeworkRating: number | null
  strengthAreas: string | null
  improvementAreas: string | null
  teacherComment: string | null
  sentAt: string | null
  sentToCount: number
  student: { id: string; name: string }
}

interface SurveyForm {
  participationRating: number
  behaviorRating: number
  homeworkRating: number
  strengthAreas: string
  improvementAreas: string
  teacherComment: string
}

const RATING_LABELS: Record<number, string> = {
  5: 'Excellent',
  4: 'Good',
  3: 'Average',
  2: 'Needs Improvement',
  1: 'Insufficient',
}

function monthLabel(month: string) {
  const [year, m] = month.split('-')
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return `${months[parseInt(m)] ?? m} ${year}`
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function StatusBadge({ status }: { status: Bulletin['status'] }) {
  const map = {
    DRAFT: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    READY: { label: 'Ready', cls: 'bg-blue-100 text-blue-700' },
    SENT:  { label: 'Sent', cls: 'bg-green-100 text-green-700' },
  }
  const s = map[status]
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
}

function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm text-gray-500 self-center">{RATING_LABELS[value]}</span>}
    </div>
  )
}

export default function BulletinsPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [month, setMonth] = useState(currentMonth())
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [sendingAll, setSendingAll] = useState(false)
  const [surveyBulletin, setSurveyBulletin] = useState<Bulletin | null>(null)
  const [previewBulletin, setPreviewBulletin] = useState<Bulletin | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const [form, setForm] = useState<SurveyForm>({
    participationRating: 0,
    behaviorRating: 0,
    homeworkRating: 0,
    strengthAreas: '',
    improvementAreas: '',
    teacherComment: '',
  })

  // Load classes
  useEffect(() => {
    fetch('/api/teacher/classes')
      .then(r => r.json())
      .then(d => {
        const list: ClassItem[] = d.classes ?? []
        setClasses(list)
        if (list.length > 0) setSelectedClass(list[0].id)
      })
      .catch(console.error)
  }, [])

  // Load bulletins when class/month changes
  useEffect(() => {
    if (!selectedClass || !month) return
    setLoading(true)
    fetch(`/api/teacher/bulletins?month=${month}&classId=${selectedClass}`)
      .then(r => r.json())
      .then(d => setBulletins(d.bulletins ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedClass, month])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleCollect() {
    if (!selectedClass || !month) return
    setCollecting(true)
    try {
      const r = await fetch('/api/teacher/bulletins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, classId: selectedClass }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Error', false); return }
      setBulletins(d.bulletins ?? [])
      showToast(`Data collected for ${d.count} student(s)`)
    } finally {
      setCollecting(false)
    }
  }

  function openSurvey(b: Bulletin) {
    setSurveyBulletin(b)
    setForm({
      participationRating: b.participationRating ?? 0,
      behaviorRating:      b.behaviorRating      ?? 0,
      homeworkRating:      b.homeworkRating       ?? 0,
      strengthAreas:       b.strengthAreas        ?? '',
      improvementAreas:    b.improvementAreas     ?? '',
      teacherComment:      b.teacherComment       ?? '',
    })
  }

  async function submitSurvey() {
    if (!surveyBulletin) return
    const r = await fetch(`/api/teacher/bulletins/${surveyBulletin.id}/survey`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    if (!r.ok) { showToast(d.error || 'Error', false); return }
    setBulletins(prev => prev.map(b => b.id === surveyBulletin.id ? d.bulletin : b))
    setSurveyBulletin(null)
    showToast('Assessment saved, bulletin ready')
  }

  async function sendOne(b: Bulletin) {
    setSendingId(b.id)
    try {
      const r = await fetch(`/api/teacher/bulletins/${b.id}/send`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Error', false); return }
      setBulletins(prev => prev.map(x => x.id === b.id ? d.bulletin : x))
      showToast(`Sent (${d.sentToCount} guardian(s))`)
    } finally {
      setSendingId(null)
    }
  }

  async function sendAll() {
    setSendingAll(true)
    try {
      const r = await fetch('/api/teacher/bulletins/send-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, classId: selectedClass }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Error', false); return }
      // Refresh bulletins
      const r2 = await fetch(`/api/teacher/bulletins?month=${month}&classId=${selectedClass}`)
      const d2 = await r2.json()
      setBulletins(d2.bulletins ?? [])
      showToast(d.message ?? `${d.sent} bulletin(s) sent`)
    } finally {
      setSendingAll(false)
    }
  }

  const readyCount = bulletins.filter(b => b.status === 'READY').length
  const sentCount  = bulletins.filter(b => b.status === 'SENT').length
  const draftCount = bulletins.filter(b => b.status === 'DRAFT').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
                ←
              </button>
              <h1 className="text-lg font-bold text-gray-900">Performance Bulletins</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="input-field text-sm"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c._count.students} student(s))</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div className="self-end flex gap-2">
            <button
              onClick={handleCollect}
              disabled={collecting || !selectedClass}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {collecting ? 'Collecting…' : '🔄 Collect Data'}
            </button>
            {readyCount > 0 && (
              <button
                onClick={sendAll}
                disabled={sendingAll}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {sendingAll ? 'Sending…' : `📨 Send All (${readyCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Stats summary */}
        {bulletins.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">{draftCount}</div>
              <div className="text-xs text-gray-500 mt-1">Draft</div>
            </div>
            <div className="bg-white rounded-2xl border border-blue-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{readyCount}</div>
              <div className="text-xs text-gray-500 mt-1">Ready</div>
            </div>
            <div className="bg-white rounded-2xl border border-green-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{sentCount}</div>
              <div className="text-xs text-gray-500 mt-1">Sent</div>
            </div>
          </div>
        )}

        {/* Bulletin list */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : bulletins.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📨</div>
            <p className="text-gray-500 mb-2">No bulletins created for this month yet.</p>
            <p className="text-sm text-gray-400">Click Collect Data to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Attendance</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Grade Avg.</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((b, i) => {
                  const totalDays = b.attendancePresent + b.attendanceAbsent + b.attendanceLate
                  const pct = totalDays > 0 ? Math.round((b.attendancePresent / totalDays) * 100) : 0
                  return (
                    <tr key={b.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{b.student.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                          {pct}%
                        </span>
                        <span className="text-gray-400 text-xs ml-1">({b.attendancePresent}/{totalDays})</span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-700">
                        {b.gradeAverage !== null ? b.gradeAverage.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewBulletin(b)}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            Preview
                          </button>
                          {b.status !== 'SENT' && (
                            <button
                              onClick={() => openSurvey(b)}
                              className="btn-secondary text-xs py-1 px-3"
                            >
                              {b.status === 'READY' ? 'Edit' : 'Assess'}
                            </button>
                          )}
                          {b.status === 'READY' && (
                            <button
                              onClick={() => sendOne(b)}
                              disabled={sendingId === b.id}
                              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {sendingId === b.id ? '…' : 'Send'}
                            </button>
                          )}
                          {b.status === 'SENT' && (
                            <span className="text-xs text-gray-400">{b.sentToCount} guardian(s)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Survey Modal */}
      {surveyBulletin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">{surveyBulletin.student.name}</h2>
                <p className="text-xs text-gray-500">{monthLabel(surveyBulletin.month)} Assessment</p>
              </div>
              <button onClick={() => setSurveyBulletin(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Attendance recap */}
              <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div><div className="font-bold text-green-600">{surveyBulletin.attendancePresent}</div><div className="text-gray-400 text-xs">Present</div></div>
                <div><div className="font-bold text-red-600">{surveyBulletin.attendanceAbsent}</div><div className="text-gray-400 text-xs">Absent</div></div>
                <div><div className="font-bold text-blue-600">{surveyBulletin.gradeAverage?.toFixed(1) ?? '—'}</div><div className="text-gray-400 text-xs">Grade Avg.</div></div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class Participation</label>
                <RatingStars value={form.participationRating} onChange={v => setForm(f => ({ ...f, participationRating: v }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Behavior</label>
                <RatingStars value={form.behaviorRating} onChange={v => setForm(f => ({ ...f, behaviorRating: v }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Homework</label>
                <RatingStars value={form.homeworkRating} onChange={v => setForm(f => ({ ...f, homeworkRating: v }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Strengths</label>
                <textarea
                  rows={2}
                  className="input-field text-sm w-full"
                  placeholder="Student's key strengths…"
                  value={form.strengthAreas}
                  onChange={e => setForm(f => ({ ...f, strengthAreas: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Areas for Improvement</label>
                <textarea
                  rows={2}
                  className="input-field text-sm w-full"
                  placeholder="Areas that need development…"
                  value={form.improvementAreas}
                  onChange={e => setForm(f => ({ ...f, improvementAreas: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teacher Comment</label>
                <textarea
                  rows={3}
                  className="input-field text-sm w-full"
                  placeholder="General comment to be shared with guardian…"
                  value={form.teacherComment}
                  onChange={e => setForm(f => ({ ...f, teacherComment: e.target.value }))}
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setSurveyBulletin(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={submitSurvey} className="btn-primary text-sm">Save & Prepare</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewBulletin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">{previewBulletin.student.name}</h2>
                <p className="text-xs text-gray-500">Bulletin Preview — {monthLabel(previewBulletin.month)}</p>
              </div>
              <button onClick={() => setPreviewBulletin(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Attendance */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-3">Attendance Status</h3>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div><div className="text-xl font-bold text-green-600">{previewBulletin.attendancePresent}</div><div className="text-xs text-gray-500">Present</div></div>
                  <div><div className="text-xl font-bold text-red-600">{previewBulletin.attendanceAbsent}</div><div className="text-xs text-gray-500">Absent</div></div>
                  <div><div className="text-xl font-bold text-amber-600">{previewBulletin.attendanceLate}</div><div className="text-xs text-gray-500">Late</div></div>
                  <div>
                    {(() => {
                      const t = previewBulletin.attendancePresent + previewBulletin.attendanceAbsent + previewBulletin.attendanceLate
                      const p = t > 0 ? Math.round((previewBulletin.attendancePresent / t) * 100) : 0
                      return <><div className="text-xl font-bold text-blue-600">{p}%</div><div className="text-xs text-gray-500">Rate</div></>
                    })()}
                  </div>
                </div>
              </div>
              {/* Grade */}
              {previewBulletin.gradeAverage !== null && (
                <div className="bg-indigo-50 rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-1">Grade Average</h3>
                  <span className="text-3xl font-bold text-indigo-700">{previewBulletin.gradeAverage.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm ml-1">/ 100</span>
                </div>
              )}
              {/* Ratings */}
              {(previewBulletin.participationRating || previewBulletin.behaviorRating || previewBulletin.homeworkRating) && (
                <div className="border border-gray-100 rounded-xl overflow-hidden text-sm">
                  {previewBulletin.participationRating && (
                    <div className="flex justify-between px-4 py-2 border-b border-gray-50">
                      <span className="text-gray-600">Participation</span>
                      <span>{'★'.repeat(previewBulletin.participationRating)}{'☆'.repeat(5 - previewBulletin.participationRating)}</span>
                    </div>
                  )}
                  {previewBulletin.behaviorRating && (
                    <div className="flex justify-between px-4 py-2 border-b border-gray-50">
                      <span className="text-gray-600">Behavior</span>
                      <span>{'★'.repeat(previewBulletin.behaviorRating)}{'☆'.repeat(5 - previewBulletin.behaviorRating)}</span>
                    </div>
                  )}
                  {previewBulletin.homeworkRating && (
                    <div className="flex justify-between px-4 py-2">
                      <span className="text-gray-600">Homework</span>
                      <span>{'★'.repeat(previewBulletin.homeworkRating)}{'☆'.repeat(5 - previewBulletin.homeworkRating)}</span>
                    </div>
                  )}
                </div>
              )}
              {previewBulletin.strengthAreas && (
                <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-3">
                  <div className="text-xs font-semibold text-green-700 uppercase mb-1">Strengths</div>
                  <div className="text-sm text-gray-700">{previewBulletin.strengthAreas}</div>
                </div>
              )}
              {previewBulletin.improvementAreas && (
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-3">
                  <div className="text-xs font-semibold text-amber-700 uppercase mb-1">Areas for Improvement</div>
                  <div className="text-sm text-gray-700">{previewBulletin.improvementAreas}</div>
                </div>
              )}
              {previewBulletin.teacherComment && (
                <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-xl p-3">
                  <div className="text-xs font-semibold text-purple-700 uppercase mb-1">Teacher Comment</div>
                  <div className="text-sm text-gray-700 italic">"{previewBulletin.teacherComment}"</div>
                </div>
              )}
              {previewBulletin.status === 'DRAFT' && (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 text-center text-sm text-gray-400">
                  Assessment not yet completed
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setPreviewBulletin(null)} className="btn-secondary text-sm">Close</button>
              {previewBulletin.status === 'READY' && (
                <button
                  onClick={() => { setPreviewBulletin(null); sendOne(previewBulletin) }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  Send
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
