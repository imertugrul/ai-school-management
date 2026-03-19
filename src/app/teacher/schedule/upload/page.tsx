'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ParsedEntry {
  day: string
  startTime: string
  endTime: string
  courseName: string
  classLevel: string
  room: string | null
}

interface Assignment {
  courseId: string
  classId: string
  course: { code: string; name: string }
  class: { name: string }
}

interface MatchedEntry extends ParsedEntry {
  matchedCourseId: string | null
  matchedClassId: string | null
  matchedLabel: string | null
  selected: boolean
  conflict?: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function UploadSchedulePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<MatchedEntry[]>([])
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    fetch('/api/teacher/assignments')
      .then(r => r.json())
      .then(data => { if (data.success) setAssignments(data.assignments) })
      .catch(console.error)
  }, [])

  // Try to match a parsed entry to an assignment
  const matchEntry = (entry: ParsedEntry, assignments: Assignment[]): { courseId: string | null; classId: string | null; label: string | null } => {
    const nameLower = entry.courseName.toLowerCase()
    const classLower = entry.classLevel.toLowerCase().replace(/\s+/g, '')

    for (const a of assignments) {
      const codeMatch = a.course.code.toLowerCase() === nameLower
      const nameMatch = a.course.name.toLowerCase().includes(nameLower) || nameLower.includes(a.course.code.toLowerCase())
      const classMatch = a.class.name.toLowerCase().replace(/\s+/g, '') === classLower ||
        classLower.includes(a.class.name.toLowerCase().replace(/\s+/g, ''))

      if ((codeMatch || nameMatch) && classMatch) {
        return { courseId: a.courseId, classId: a.classId, label: `${a.course.code} – ${a.course.name} (${a.class.name})` }
      }
    }

    // Try course only match
    for (const a of assignments) {
      const codeMatch = a.course.code.toLowerCase() === nameLower
      const nameMatch = a.course.name.toLowerCase().includes(nameLower) || nameLower.includes(a.course.code.toLowerCase())
      if (codeMatch || nameMatch) {
        return { courseId: a.courseId, classId: a.classId, label: `${a.course.code} – ${a.course.name} (${a.class.name})` }
      }
    }

    return { courseId: null, classId: null, label: null }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    setError('')
    setEntries([])
    setStep('upload')
  }

  const handleParse = async () => {
    if (!file) return
    setParsing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/teacher/schedule/parse', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to parse schedule')
        return
      }

      const matched: MatchedEntry[] = data.entries.map((entry: ParsedEntry) => {
        const { courseId, classId, label } = matchEntry(entry, assignments)
        return {
          ...entry,
          matchedCourseId: courseId,
          matchedClassId: classId,
          matchedLabel: label,
          selected: courseId !== null
        }
      })

      setEntries(matched)
      setStep('preview')
    } catch (err) {
      setError('An error occurred while parsing.')
    } finally {
      setParsing(false)
    }
  }

  const handleManualMatch = (index: number, assignmentKey: string) => {
    const [courseId, classId] = assignmentKey.split('|')
    const a = assignments.find(a => a.courseId === courseId && a.classId === classId)
    setEntries(prev => prev.map((e, i) => i === index ? {
      ...e,
      matchedCourseId: courseId || null,
      matchedClassId: classId || null,
      matchedLabel: a ? `${a.course.code} – ${a.course.name} (${a.class.name})` : null,
      selected: !!courseId
    } : e))
  }

  const handleToggle = (index: number) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, selected: !e.selected } : e))
  }

  const handleSave = async () => {
    const toSave = entries.filter(e => e.selected && e.matchedCourseId)
    if (toSave.length === 0) {
      setError('No entries selected to save.')
      return
    }

    setSaving(true)
    let saved = 0
    const errors: string[] = []

    for (const entry of toSave) {
      const dayIndex = DAYS.indexOf(entry.day)
      if (dayIndex === -1) continue

      const res = await fetch('/api/teacher/schedule/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: entry.matchedCourseId,
          dayOfWeek: dayIndex,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room || null
        })
      })
      const data = await res.json()
      if (data.success) {
        saved++
      } else {
        errors.push(`${entry.day} ${entry.startTime} ${entry.courseName}: ${data.error}`)
      }
    }

    setSavedCount(saved)
    setSaving(false)
    setStep('done')

    if (errors.length > 0) {
      setError(errors.join('\n'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Upload Schedule</h1>
            <button onClick={() => router.push('/teacher/schedule')} className="btn-secondary">
              ← Back to Schedule
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="card space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Upload your schedule file</h2>
              <p className="text-sm text-gray-500">
                Supported formats: PDF, JPG, PNG, WEBP. Claude AI will read the file and extract your schedule automatically.
              </p>
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-primary-400 transition-colors">
              <div className="text-5xl mb-3">{file ? '📄' : '📂'}</div>
              <p className="text-gray-700 font-medium">
                {file ? file.name : 'Click to select file'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF · JPG · PNG · WEBP</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg whitespace-pre-line">
                {error}
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!file || parsing}
              className="btn-primary w-full disabled:opacity-50"
            >
              {parsing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Analyzing with AI...
                </span>
              ) : 'Analyze Schedule'}
            </button>
          </div>
        )}

        {/* Step 2: Preview & Match */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Review Extracted Entries</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {entries.length} entries found · {entries.filter(e => e.selected).length} selected
                  </p>
                </div>
                <button onClick={() => setStep('upload')} className="btn-secondary text-sm">
                  ← Re-upload
                </button>
              </div>
            </div>

            {entries.map((entry, i) => (
              <div
                key={i}
                className={`card border-2 transition-colors ${entry.selected ? 'border-primary-300 bg-primary-50' : 'border-gray-200 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <input
                    type="checkbox"
                    checked={entry.selected}
                    onChange={() => handleToggle(i)}
                    className="mt-1 w-4 h-4 accent-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-sm font-semibold text-primary-600">{entry.day}</span>
                      <span className="text-sm text-gray-700">{entry.startTime} – {entry.endTime}</span>
                      {entry.room && <span className="text-sm text-gray-500">Room {entry.room}</span>}
                    </div>
                    <p className="font-medium text-gray-900">{entry.courseName}
                      <span className="ml-2 text-sm text-gray-500">· {entry.classLevel}</span>
                    </p>

                    {/* Match selector */}
                    <div className="mt-2">
                      {entry.matchedLabel ? (
                        <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          ✓ Matched: {entry.matchedLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                          ⚠ No automatic match
                        </span>
                      )}
                    </div>

                    <select
                      className="input-field text-sm mt-2"
                      value={entry.matchedCourseId && entry.matchedClassId ? `${entry.matchedCourseId}|${entry.matchedClassId}` : ''}
                      onChange={e => handleManualMatch(i, e.target.value)}
                    >
                      <option value="">— Select course manually —</option>
                      {assignments.map(a => (
                        <option key={`${a.courseId}|${a.classId}`} value={`${a.courseId}|${a.classId}`}>
                          {a.course.code} – {a.course.name} ({a.class.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg whitespace-pre-line">
                {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || entries.filter(e => e.selected && e.matchedCourseId).length === 0}
              className="btn-primary w-full disabled:opacity-50"
            >
              {saving ? 'Saving...' : `Save ${entries.filter(e => e.selected && e.matchedCourseId).length} Entries to Schedule`}
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{savedCount} entries added!</h2>
            <p className="text-gray-500 mb-6">Your schedule has been updated.</p>
            {error && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg mb-4 text-left whitespace-pre-line">
                Some entries were skipped (conflicts or errors):{'\n'}{error}
              </div>
            )}
            <button onClick={() => router.push('/teacher/schedule')} className="btn-primary">
              View My Schedule
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
