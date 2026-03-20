'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Student { id: string; name: string }
interface ClassItem { id: string; name: string }
interface Note {
  id: string
  title: string
  content: string
  type: string
  createdAt: string
  student: Student | null
  class: ClassItem | null
}

const NOTE_TYPES = [
  { value: 'GENERAL', label: 'General', color: 'bg-gray-100 text-gray-700' },
  { value: 'STUDENT_BEHAVIOR', label: 'Student Behavior', color: 'bg-red-100 text-red-700' },
  { value: 'STUDENT_PROGRESS', label: 'Student Progress', color: 'bg-green-100 text-green-700' },
  { value: 'CLASS_OBSERVATION', label: 'Class Observation', color: 'bg-blue-100 text-blue-700' },
  { value: 'MEETING', label: 'Meeting', color: 'bg-purple-100 text-purple-700' },
]

export default function TeacherNotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('ALL')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', content: '', type: 'GENERAL', studentId: '', classId: ''
  })

  useEffect(() => {
    fetchNotes()
    fetchStudentsAndClasses()
  }, [])

  const fetchNotes = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/teacher/notes?${params}`)
    const data = await res.json()
    if (data.success) setNotes(data.notes)
    setLoading(false)
  }

  const fetchStudentsAndClasses = async () => {
    const [classRes, assignRes] = await Promise.all([
      fetch('/api/teacher/classes'),
      fetch('/api/teacher/assignments')
    ])
    const classData = await classRes.json()
    if (classData.success) setClasses(classData.classes)

    const assignData = await assignRes.json()
    if (assignData.success) {
      // Get students from teacher's classes
      const studs: Student[] = []
      // We'll just leave students empty for now - admin can see all
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.content) { setError('Title and content are required.'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/teacher/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        type: form.type,
        studentId: form.studentId || null,
        classId: form.classId || null,
      })
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setNotes(prev => [data.note, ...prev])
      setShowForm(false)
      setForm({ title: '', content: '', type: 'GENERAL', studentId: '', classId: '' })
    } else {
      setError(data.error || 'Failed to save')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    await fetch(`/api/teacher/notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchNotes()
  }

  const getTypeInfo = (type: string) => NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0]

  const filtered = notes.filter(n =>
    (filterType === 'ALL' || n.type === filterType) &&
    (search === '' || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📝</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Teaching Notes</h1>
                <p className="text-xs text-gray-500">Quick notes and observations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ New Note</button>
              <button onClick={() => router.push('/teacher/dashboard')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-secondary text-sm">Search</button>
          </form>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filterType === 'ALL' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              All
            </button>
            {NOTE_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filterType === t.value ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* New Note Form */}
        {showForm && (
          <div className="card mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">New Note</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Note title..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Class (optional)</label>
                <select className="input-field" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                  <option value="">No specific class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Content *</label>
                <textarea
                  className="input-field min-h-[120px] resize-y"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your note here..."
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Note'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first teaching note</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">+ New Note</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(note => {
              const typeInfo = getTypeInfo(note.type)
              return (
                <div key={note.id} className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          {note.class && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {note.class.name}
                            </span>
                          )}
                          {note.student && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {note.student.name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">{note.title}</h3>
                        {expanded !== note.id ? (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{note.content}</p>
                        ) : (
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{note.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExpanded(expanded === note.id ? null : note.id)}
                          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-lg transition-colors font-medium"
                        >
                          {expanded === note.id ? 'Less' : 'More'}
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
