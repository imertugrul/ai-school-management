'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type QType = string

interface LibraryQ {
  id: string; type: QType; content: string; points: number
  options?: any; correctAnswer?: string; config?: any; rubric?: any
  tags: string[]; subject?: string; timesUsed: number
  createdAt: string; updatedAt: string
}

const Q_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'MCQ (Single)', MCQ_MULTIPLE: 'MCQ (Multiple)', TRUE_FALSE: 'True/False',
  SHORT_ANSWER: 'Short Answer', ESSAY: 'Long Answer', CODE: 'Code',
  FILL_TEXT: 'Fill Text', FILL_DROPDOWN: 'Fill Dropdown',
  MATCH: 'Match', SORT: 'Sort', CLASSIFY: 'Classify', TABLE: 'Table',
  DRAWING: 'Drawing', LABEL_DRAG: 'Label Drag', LABEL_FILL: 'Label Fill',
  HOTSPOT: 'Hotspot', GEOGEBRA: 'GeoGebra', DESMOS: 'Desmos',
  AUDIO_RESPONSE: 'Audio Answer', GROUP: 'Group',
}

const Q_TYPE_COLORS: Record<string, string> = {
  MULTIPLE_CHOICE: 'bg-blue-100 text-blue-700', MCQ_MULTIPLE: 'bg-blue-100 text-blue-700',
  TRUE_FALSE: 'bg-teal-100 text-teal-700', SHORT_ANSWER: 'bg-gray-100 text-gray-700',
  ESSAY: 'bg-gray-100 text-gray-700', CODE: 'bg-slate-100 text-slate-700',
  FILL_TEXT: 'bg-yellow-100 text-yellow-700', FILL_DROPDOWN: 'bg-yellow-100 text-yellow-700',
  MATCH: 'bg-purple-100 text-purple-700', SORT: 'bg-purple-100 text-purple-700',
  CLASSIFY: 'bg-indigo-100 text-indigo-700', TABLE: 'bg-indigo-100 text-indigo-700',
}

export default function LibraryPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<LibraryQ[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const fetchQ = async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (typeFilter) p.set('type', typeFilter)
    const res = await fetch(`/api/teacher/library?${p}`)
    const data = await res.json()
    if (data.success) setQuestions(data.questions)
    setLoading(false)
  }

  useEffect(() => { fetchQ() }, [search, typeFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this question from your library?')) return
    setDeleting(id)
    await fetch(`/api/teacher/library/${id}`, { method: 'DELETE' })
    setQuestions(q => q.filter(x => x.id !== id))
    setDeleting(null)
  }

  // Tag counts
  const allTags = [...new Set(questions.flatMap(q => q.tags))]
  const [tagFilter, setTagFilter] = useState('')
  const displayed = tagFilter ? questions.filter(q => q.tags.includes(tagFilter)) : questions

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-lg">📚</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Question Library</h1>
                <p className="text-xs text-gray-500">{questions.length} saved question{questions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/teacher/tests/create')} className="btn-primary text-sm">+ New Test</button>
              <button onClick={() => router.push('/teacher/dashboard')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            className="input-field flex-1 min-w-48"
            placeholder="🔍 Search questions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input-field w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All question types</option>
            {Object.entries(Q_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(search || typeFilter || tagFilter) && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); setTagFilter('') }}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              ✕ Clear
            </button>
          )}
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider self-center">Tags:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${tagFilter === tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {questions.length === 0 ? 'Your library is empty' : 'No results found'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {questions.length === 0
                ? 'When creating tests, check "Save all questions to my Library" to build your collection.'
                : 'Try adjusting your search or filters.'}
            </p>
            {questions.length === 0 && (
              <button onClick={() => router.push('/teacher/tests/create')} className="btn-primary">Create a Test</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(q => (
              <div key={q.id} className={`rounded-2xl bg-white border shadow-sm transition-all ${expanded === q.id ? 'border-blue-200 shadow-blue-50' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${Q_TYPE_COLORS[q.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {Q_TYPE_LABELS[q.type] ?? q.type}
                  </span>
                  <p className="flex-1 text-sm text-gray-800 truncate min-w-0">{q.content}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    {q.timesUsed > 0 && <span className="text-xs text-gray-400">Used {q.timesUsed}×</span>}
                    <span className="text-xs text-gray-400">{q.points}pt</span>
                    <span className="text-gray-300">{expanded === q.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Detail */}
                {expanded === q.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
                    <p className="text-sm text-gray-800 whitespace-pre-line">{q.content}</p>

                    {/* Options (MCQ) */}
                    {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Options</p>
                        <ul className="space-y-1.5">
                          {q.options.map((opt: string, i: number) => (
                            <li key={i} className={`flex items-center gap-2 text-sm ${opt === q.correctAnswer ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${opt === q.correctAnswer ? 'bg-green-100' : 'bg-gray-100 text-gray-500'}`}>
                                {opt === q.correctAnswer ? '✓' : String.fromCharCode(65 + i)}
                              </span>
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Answer */}
                    {q.correctAnswer && !Array.isArray(q.options) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Answer</p>
                        <p className="text-sm text-green-700 font-medium">{q.correctAnswer}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {q.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {q.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-gray-400 flex-1">
                        Added {new Date(q.createdAt).toLocaleDateString()}
                        {q.subject && ` · ${q.subject}`}
                      </span>
                      <button
                        onClick={() => handleDelete(q.id)}
                        disabled={deleting === q.id}
                        className="text-xs px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50"
                      >
                        {deleting === q.id ? 'Removing…' : 'Remove from library'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
