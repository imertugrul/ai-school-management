'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
export type QType =
  | 'MULTIPLE_CHOICE' | 'MCQ_MULTIPLE' | 'TRUE_FALSE'
  | 'SHORT_ANSWER' | 'ESSAY'
  | 'FILL_TEXT' | 'FILL_DROPDOWN'
  | 'MATCH' | 'SORT' | 'CLASSIFY' | 'TABLE'
  | 'DRAWING' | 'LABEL_DRAG' | 'LABEL_FILL' | 'HOTSPOT'
  | 'GEOGEBRA' | 'DESMOS' | 'AUDIO_RESPONSE' | 'GROUP' | 'CODE'

export type BType = 'TEXT' | 'ACCORDION' | 'IMAGE' | 'VIDEO' | 'PDF' | 'AUDIO' | 'SIMULATION' | 'DOCUMENT' | 'PPT' | 'EMBED'

export interface QItem {
  kind: 'question'
  tempId: string
  type: QType
  content: string
  points: number
  options?: string[]
  correctAnswer?: string
  config?: any
  rubric?: string
  tags?: string[]
}

export interface BItem {
  kind: 'block'
  tempId: string
  blockType: BType
  content: any
}

export type TestItem = QItem | BItem

interface TestMeta {
  title: string; subject: string; description: string
  startDate: string; endDate: string; isActive: boolean
}

interface LibraryQ {
  id: string; type: QType; content: string; points: number
  options?: any; correctAnswer?: string; config?: any; rubric?: any
  tags: string[]; subject?: string; timesUsed: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const Q_TYPES: { value: QType; label: string; icon: string; color: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'MCQ (Single)',    icon: '⊙', color: 'bg-blue-100 text-blue-700' },
  { value: 'MCQ_MULTIPLE',    label: 'MCQ (Multiple)', icon: '☑', color: 'bg-blue-100 text-blue-700' },
  { value: 'TRUE_FALSE',      label: 'True / False',   icon: '⊤', color: 'bg-teal-100 text-teal-700' },
  { value: 'SHORT_ANSWER',    label: 'Short Answer',   icon: '─', color: 'bg-gray-100 text-gray-700' },
  { value: 'ESSAY',           label: 'Long Answer',    icon: '≡', color: 'bg-gray-100 text-gray-700' },
  { value: 'FILL_TEXT',       label: 'Fill-in Text',   icon: '_', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'FILL_DROPDOWN',   label: 'Fill Dropdown',  icon: '▾', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'MATCH',           label: 'Match',          icon: '⇔', color: 'bg-purple-100 text-purple-700' },
  { value: 'SORT',            label: 'Sort / Order',   icon: '↕', color: 'bg-purple-100 text-purple-700' },
  { value: 'CLASSIFY',        label: 'Classify',       icon: '⊞', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'TABLE',           label: 'Table',          icon: '⊟', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'DRAWING',         label: 'Drawing',        icon: '✏', color: 'bg-rose-100 text-rose-700' },
  { value: 'LABEL_DRAG',      label: 'Label Drag',     icon: '⊡', color: 'bg-rose-100 text-rose-700' },
  { value: 'LABEL_FILL',      label: 'Label Fill',     icon: '⊠', color: 'bg-rose-100 text-rose-700' },
  { value: 'HOTSPOT',         label: 'Hotspot',        icon: '⊕', color: 'bg-orange-100 text-orange-700' },
  { value: 'GEOGEBRA',        label: 'GeoGebra',       icon: '∿', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'DESMOS',          label: 'Desmos',         icon: '∫', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'AUDIO_RESPONSE',  label: 'Audio Answer',   icon: '🎤', color: 'bg-pink-100 text-pink-700' },
  { value: 'GROUP',           label: 'Group',          icon: '⊞', color: 'bg-slate-100 text-slate-700' },
  { value: 'CODE',            label: 'Code',           icon: '<>', color: 'bg-slate-100 text-slate-700' },
]

const B_TYPES: { value: BType; label: string; icon: string }[] = [
  { value: 'TEXT',       label: 'Text / Instructions', icon: '📝' },
  { value: 'ACCORDION',  label: 'Accordion',           icon: '⊞' },
  { value: 'IMAGE',      label: 'Image',               icon: '🖼' },
  { value: 'VIDEO',      label: 'Video',               icon: '▶' },
  { value: 'PDF',        label: 'PDF',                 icon: '📄' },
  { value: 'AUDIO',      label: 'Audio',               icon: '🔊' },
  { value: 'SIMULATION', label: 'Simulation',          icon: '⚙' },
  { value: 'DOCUMENT',   label: 'Document',            icon: '📋' },
  { value: 'PPT',        label: 'PowerPoint',          icon: '📊' },
  { value: 'EMBED',      label: 'Custom Embed',        icon: '</>' },
]

const ADVANCED_TYPES: QType[] = ['DRAWING','LABEL_DRAG','LABEL_FILL','HOTSPOT','GEOGEBRA','DESMOS','AUDIO_RESPONSE','GROUP']

const uid = () => Math.random().toString(36).slice(2)

function qLabel(type: QType) { return Q_TYPES.find(t => t.value === type)?.label ?? type }
function qColor(type: QType) { return Q_TYPES.find(t => t.value === type)?.color ?? 'bg-gray-100 text-gray-600' }
function qIcon(type: QType)  { return Q_TYPES.find(t => t.value === type)?.icon  ?? '?' }

const defaultQ = (): QItem => ({
  kind: 'question', tempId: uid(), type: 'MULTIPLE_CHOICE',
  content: '', points: 1,
  options: ['', '', '', ''], correctAnswer: '', tags: [],
})

const defaultBlock = (blockType: BType): BItem => {
  const content: any =
    blockType === 'TEXT'      ? { text: '' } :
    blockType === 'ACCORDION' ? { sections: [{ title: '', body: '' }] } :
    blockType === 'IMAGE'     ? { url: '', alt: '', caption: '' } :
    blockType === 'VIDEO'     ? { url: '', videoType: 'youtube' } :
    blockType === 'PDF'       ? { url: '', title: '' } :
    blockType === 'AUDIO'     ? { url: '' } :
    blockType === 'EMBED'     ? { html: '', height: 400 } : { url: '' }
  return { kind: 'block', tempId: uid(), blockType, content }
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface TestEditorProps {
  mode: 'create' | 'edit'
  testId?: string
  initialMeta?: Partial<TestMeta>
  initialItems?: TestItem[]
}

export default function TestEditor({ mode, testId, initialMeta, initialItems }: TestEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveToLibrary, setSaveToLibrary] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(mode === 'create')

  const [meta, setMeta] = useState<TestMeta>({
    title: '', subject: '', description: '',
    startDate: '', endDate: '', isActive: false,
    ...initialMeta,
  })

  const [items, setItems] = useState<TestItem[]>(initialItems ?? [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddQ, setShowAddQ] = useState(false)
  const [showAddB, setShowAddB] = useState(false)
  const [insertAfter, setInsertAfter] = useState<string | null>(null) // tempId to insert after

  // Library
  const [showLibrary, setShowLibrary] = useState(false)
  const [libItems, setLibItems] = useState<LibraryQ[]>([])
  const [libSearch, setLibSearch] = useState('')
  const [libType, setLibType] = useState('')
  const [libLoading, setLibLoading] = useState(false)

  const fetchLibrary = useCallback(async () => {
    setLibLoading(true)
    const p = new URLSearchParams()
    if (libSearch) p.set('search', libSearch)
    if (libType)   p.set('type',   libType)
    const res = await fetch(`/api/teacher/library?${p}`)
    const data = await res.json()
    if (data.success) setLibItems(data.questions)
    setLibLoading(false)
  }, [libSearch, libType])

  useEffect(() => { if (showLibrary) fetchLibrary() }, [showLibrary, libSearch, libType])

  // ── Item manipulation ──────────────────────────────────────────────────────
  const addItem = (item: TestItem) => {
    setItems(prev => {
      if (insertAfter) {
        const idx = prev.findIndex(i => i.tempId === insertAfter)
        const next = [...prev]
        next.splice(idx + 1, 0, item)
        return next
      }
      return [...prev, item]
    })
    setInsertAfter(null)
    setEditingId(item.tempId)
    setShowAddQ(false)
    setShowAddB(false)
  }

  const updateItem = (tempId: string, patch: Partial<QItem> | Partial<BItem>) => {
    setItems(prev => prev.map(i => i.tempId === tempId ? { ...i, ...patch } as TestItem : i))
  }

  const removeItem = (tempId: string) => {
    setItems(prev => prev.filter(i => i.tempId !== tempId))
    if (editingId === tempId) setEditingId(null)
  }

  const moveItem = (tempId: string, dir: -1 | 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.tempId === tempId)
      if (idx + dir < 0 || idx + dir >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[idx + dir]] = [next[idx + dir], next[idx]]
      return next
    })
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!meta.title.trim()) { alert('Test title is required'); return }
    setSaving(true)
    const questions = items
      .filter(i => i.kind === 'question')
      .map((i, idx) => ({ ...(i as QItem), orderIndex: idx }))
    const blocks = items
      .filter(i => i.kind === 'block')
      .map((i, idx) => ({ ...(i as BItem), orderIndex: idx }))

    const body = { ...meta, questions, contentBlocks: blocks, saveToLibrary }
    const url  = mode === 'create' ? '/api/tests/create' : `/api/tests/${testId}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setSaving(false)
    if (data.success) router.push('/teacher/tests')
    else alert(data.error || 'Failed to save')
  }

  // ── Library add ───────────────────────────────────────────────────────────
  const addFromLibrary = (lq: LibraryQ) => {
    const item: QItem = {
      kind: 'question', tempId: uid(),
      type: lq.type, content: lq.content, points: lq.points,
      options: lq.options ? (Array.isArray(lq.options) ? lq.options : undefined) : undefined,
      correctAnswer: lq.correctAnswer ?? '',
      config: lq.config ?? undefined,
      rubric: (lq.rubric as any)?.criteria ?? '',
      tags: lq.tags ?? [],
    }
    addItem(item)
    fetch(`/api/teacher/library/${lq.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timesUsed: lq.timesUsed + 1 }) })
  }

  const qCount = items.filter(i => i.kind === 'question').length
  const totalPts = items.filter(i => i.kind === 'question').reduce((s, i) => s + (i as QItem).points, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <span className="text-white text-base">📝</span>
              </div>
              <input
                className="text-lg font-bold text-gray-900 bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none truncate min-w-0 w-64 md:w-96"
                placeholder="Test title..."
                value={meta.title}
                onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden md:flex text-xs text-gray-400 gap-3">
                <span>{qCount} Q</span>
                <span>{totalPts} pts</span>
              </span>
              <button onClick={() => setShowLibrary(v => !v)} className="btn-secondary text-sm">📚 Library</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Saving…' : mode === 'create' ? '✓ Create Test' : '✓ Save Changes'}
              </button>
              <button onClick={() => router.push('/teacher/tests')} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">✕</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* ── Main area ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Settings */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setSettingsOpen(v => !v)}
            >
              <span className="font-semibold text-gray-900">Test Settings</span>
              <span className="text-gray-400 text-sm">{settingsOpen ? '▲' : '▼'}</span>
            </button>
            {settingsOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                    <input className="input-field" placeholder="e.g. Mathematics" value={meta.subject} onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                    <input className="input-field" placeholder="Optional description" value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input type="datetime-local" className="input-field" value={meta.startDate} onChange={e => setMeta(m => ({ ...m, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                    <input type="datetime-local" className="input-field" value={meta.endDate} onChange={e => setMeta(m => ({ ...m, endDate: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={meta.isActive} onChange={e => setMeta(m => ({ ...m, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                    <span className="font-medium text-gray-700">Activate immediately</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={saveToLibrary} onChange={e => setSaveToLibrary(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
                    <span className="font-medium text-gray-700">Save all questions to my Library</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Items list */}
          {items.length === 0 && (
            <div className="rounded-2xl bg-white border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-500 font-medium">No questions yet</p>
              <p className="text-sm text-gray-400 mt-1">Add questions or content blocks below</p>
            </div>
          )}

          {items.map((item, idx) => (
            <div key={item.tempId}>
              <ItemCard
                item={item} idx={idx} total={items.length}
                isEditing={editingId === item.tempId}
                onToggleEdit={() => setEditingId(editingId === item.tempId ? null : item.tempId)}
                onUpdate={patch => updateItem(item.tempId, patch)}
                onRemove={() => removeItem(item.tempId)}
                onMove={dir => moveItem(item.tempId, dir)}
              />
              {/* Insert between */}
              <InsertBar
                onAddQ={() => { setInsertAfter(item.tempId); setShowAddQ(true); setShowAddB(false) }}
                onAddB={() => { setInsertAfter(item.tempId); setShowAddB(true); setShowAddQ(false) }}
                onFromLib={() => { setInsertAfter(item.tempId); setShowLibrary(true) }}
              />
            </div>
          ))}

          {/* Bottom add bar */}
          <AddBar
            onAddQ={() => { setInsertAfter(null); setShowAddQ(v => !v); setShowAddB(false) }}
            onAddB={() => { setInsertAfter(null); setShowAddB(v => !v); setShowAddQ(false) }}
            onFromLib={() => { setInsertAfter(null); setShowLibrary(true) }}
          />

          {/* Question type picker */}
          {showAddQ && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Choose Question Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Q_TYPES.map(qt => (
                  <button
                    key={qt.value}
                    onClick={() => addItem({ ...defaultQ(), type: qt.value, ...(qt.value === 'MULTIPLE_CHOICE' || qt.value === 'MCQ_MULTIPLE' ? { options: ['', '', '', ''] } : { options: undefined }), tempId: uid() })}
                    className="flex flex-col items-start gap-1 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                  >
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${qt.color}`}>{qt.icon}</span>
                    <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-700">{qt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content block type picker */}
          {showAddB && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Choose Content Block</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {B_TYPES.map(bt => (
                  <button
                    key={bt.value}
                    onClick={() => addItem(defaultBlock(bt.value))}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <span className="text-2xl">{bt.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700 text-center">{bt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Library Drawer ── */}
        {showLibrary && (
          <div className="w-80 shrink-0">
            <div className="sticky top-24 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900 text-sm">📚 Question Library</span>
                <button onClick={() => setShowLibrary(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>
              <div className="p-3 space-y-2 border-b border-gray-100">
                <input className="input-field text-sm" placeholder="Search questions…" value={libSearch} onChange={e => setLibSearch(e.target.value)} />
                <select className="input-field text-sm" value={libType} onChange={e => setLibType(e.target.value)}>
                  <option value="">All types</option>
                  {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-2 space-y-2">
                {libLoading ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
                ) : libItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No questions saved yet.<br/>Check "Save to Library" when creating tests.</div>
                ) : libItems.map(lq => (
                  <div key={lq.id} className="rounded-xl border border-gray-100 p-3 hover:border-blue-200 hover:bg-blue-50 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${qColor(lq.type)}`}>{qLabel(lq.type)}</span>
                      <span className="text-xs text-gray-400">{lq.points}pt</span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2 mb-2">{lq.content}</p>
                    {lq.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {lq.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>)}
                      </div>
                    )}
                    <button onClick={() => addFromLibrary(lq)} className="w-full text-xs font-semibold text-blue-600 hover:text-blue-800 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                      + Add to test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Insert / Add bars ────────────────────────────────────────────────────────
function InsertBar({ onAddQ, onAddB, onFromLib }: { onAddQ:()=>void; onAddB:()=>void; onFromLib:()=>void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2 my-1 group">
      <div className="flex-1 h-px bg-gray-100 group-hover:bg-gray-200 transition-colors" />
      {open ? (
        <div className="flex items-center gap-1">
          <button onClick={()=>{setOpen(false);onAddQ()}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors font-medium">+ Question</button>
          <button onClick={()=>{setOpen(false);onAddB()}} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors font-medium">+ Content</button>
          <button onClick={()=>{setOpen(false);onFromLib()}} className="text-xs px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors font-medium">Library</button>
          <button onClick={()=>setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
        </div>
      ) : (
        <button onClick={()=>setOpen(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 hover:text-blue-600 px-2 py-0.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200">
          + insert here
        </button>
      )}
      <div className="flex-1 h-px bg-gray-100 group-hover:bg-gray-200 transition-colors" />
    </div>
  )
}

function AddBar({ onAddQ, onAddB, onFromLib }: { onAddQ:()=>void; onAddB:()=>void; onFromLib:()=>void }) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button onClick={onAddQ} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/30 hover:shadow-md transition-all">
        + Add Question
      </button>
      <button onClick={onAddB} className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all">
        + Content Block
      </button>
      <button onClick={onFromLib} className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
        📚 From Library
      </button>
    </div>
  )
}

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({ item, idx, total, isEditing, onToggleEdit, onUpdate, onRemove, onMove }: {
  item: TestItem; idx: number; total: number
  isEditing: boolean
  onToggleEdit: () => void
  onUpdate: (patch: any) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  if (item.kind === 'question') return (
    <div className={`rounded-2xl bg-white border shadow-sm transition-all ${isEditing ? 'border-blue-300 shadow-blue-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 cursor-pointer" onClick={onToggleEdit}>
        <span className="w-7 h-7 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
          Q{idx + 1}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${qColor(item.type)}`}>{qIcon(item.type)} {qLabel(item.type)}</span>
        <p className="flex-1 text-sm text-gray-700 truncate min-w-0">{item.content || <span className="text-gray-400 italic">No content yet</span>}</p>
        <span className="text-xs text-gray-400 shrink-0">{item.points}pt</span>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={e=>{e.stopPropagation();onMove(-1)}} disabled={idx===0} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">↑</button>
          <button onClick={e=>{e.stopPropagation();onMove(1)}} disabled={idx===total-1} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">↓</button>
          <button onClick={e=>{e.stopPropagation();onRemove()}} className="p-1 text-gray-300 hover:text-red-500 transition-colors ml-1">✕</button>
        </div>
      </div>
      {/* Editor */}
      {isEditing && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <QuestionEditor item={item} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  )

  // Block card
  const bt = B_TYPES.find(b => b.value === item.blockType)
  return (
    <div className={`rounded-2xl bg-white border shadow-sm transition-all ${isEditing ? 'border-indigo-300 shadow-indigo-100' : 'border-gray-100 hover:border-gray-200'}`}>
      <div className="flex items-center gap-3 px-5 py-3 cursor-pointer" onClick={onToggleEdit}>
        <span className="text-xl">{bt?.icon ?? '📦'}</span>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{bt?.label ?? item.blockType}</span>
        <p className="flex-1 text-sm text-gray-500 truncate">Content block</p>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={e=>{e.stopPropagation();onMove(-1)}} disabled={idx===0} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">↑</button>
          <button onClick={e=>{e.stopPropagation();onMove(1)}} disabled={idx===total-1} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">↓</button>
          <button onClick={e=>{e.stopPropagation();onRemove()}} className="p-1 text-gray-300 hover:text-red-500 transition-colors ml-1">✕</button>
        </div>
      </div>
      {isEditing && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <BlockEditor item={item} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  )
}

// ─── Question Editor ───────────────────────────────────────────────────────────
function QuestionEditor({ item, onUpdate }: { item: QItem; onUpdate: (p:any)=>void }) {
  const isAdvanced = ADVANCED_TYPES.includes(item.type)

  return (
    <div className="space-y-4 pt-4">
      {/* Type selector */}
      <div className="flex items-center gap-3">
        <select
          className="input-field w-auto text-sm"
          value={item.type}
          onChange={e => onUpdate({ type: e.target.value as QType, options: ['MULTIPLE_CHOICE','MCQ_MULTIPLE'].includes(e.target.value) ? (item.options?.length ? item.options : ['','','','']) : undefined, correctAnswer: '' })}
        >
          {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500">Points</label>
          <input type="number" min="0" className="input-field w-20 text-sm" value={item.points} onChange={e => onUpdate({ points: Number(e.target.value) })} />
        </div>
      </div>

      {/* Question text */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Question</label>
        <textarea
          rows={3} className="input-field resize-y text-sm"
          placeholder="Write your question here…"
          value={item.content}
          onChange={e => onUpdate({ content: e.target.value })}
        />
      </div>

      {/* Type-specific editors */}
      {isAdvanced ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
          <strong>{qLabel(item.type)}</strong> — Advanced editor coming soon. Question will be saved and rendered with a placeholder for students.
        </div>
      ) : (
        <>
          {(item.type === 'MULTIPLE_CHOICE' || item.type === 'MCQ_MULTIPLE') && (
            <MCQEditor item={item} onUpdate={onUpdate} multi={item.type === 'MCQ_MULTIPLE'} />
          )}
          {item.type === 'TRUE_FALSE' && <TrueFalseEditor item={item} onUpdate={onUpdate} />}
          {(item.type === 'SHORT_ANSWER' || item.type === 'ESSAY' || item.type === 'CODE') && (
            <SimpleAnswerEditor item={item} onUpdate={onUpdate} />
          )}
          {item.type === 'FILL_TEXT' && <FillTextEditor item={item} onUpdate={onUpdate} />}
          {item.type === 'FILL_DROPDOWN' && <FillDropdownEditor item={item} onUpdate={onUpdate} />}
          {item.type === 'MATCH' && <MatchEditor item={item} onUpdate={onUpdate} />}
          {item.type === 'SORT' && <SortEditor item={item} onUpdate={onUpdate} />}
          {item.type === 'CLASSIFY' && <ClassifyEditor item={item} onUpdate={onUpdate} />}
          {item.type === 'TABLE' && <TableEditor item={item} onUpdate={onUpdate} />}
        </>
      )}

      {/* Tags */}
      <TagEditor tags={item.tags ?? []} onChange={tags => onUpdate({ tags })} />
    </div>
  )
}

// ─── MCQ Editor ───────────────────────────────────────────────────────────────
function MCQEditor({ item, onUpdate, multi }: { item: QItem; onUpdate:(p:any)=>void; multi: boolean }) {
  const opts = item.options ?? ['', '', '', '']
  const correctAnswers: string[] = (() => {
    if (!multi) return []
    try { return JSON.parse(item.correctAnswer ?? '[]') } catch { return [] }
  })()

  const setOpts = (o: string[]) => onUpdate({ options: o })
  const toggleCorrect = (opt: string) => {
    if (multi) {
      const next = correctAnswers.includes(opt) ? correctAnswers.filter(x=>x!==opt) : [...correctAnswers, opt]
      onUpdate({ correctAnswer: JSON.stringify(next) })
    } else {
      onUpdate({ correctAnswer: opt })
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Options {multi ? '(check all correct)' : '(select one correct)'}
      </label>
      {opts.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          {multi ? (
            <input type="checkbox" checked={correctAnswers.includes(opt)} onChange={() => toggleCorrect(opt)}
              className="w-4 h-4 rounded accent-blue-600" />
          ) : (
            <input type="radio" name={`correct-${item.tempId}`} checked={item.correctAnswer === opt}
              onChange={() => toggleCorrect(opt)} className="w-4 h-4 accent-blue-600" />
          )}
          <input
            className={`input-field text-sm flex-1 ${(multi ? correctAnswers.includes(opt) : item.correctAnswer === opt) ? 'border-green-400 bg-green-50' : ''}`}
            placeholder={`Option ${i + 1}`} value={opt}
            onChange={e => { const n=[...opts]; n[i]=e.target.value; setOpts(n) }}
          />
          <button onClick={() => setOpts(opts.filter((_,j)=>j!==i))} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">✕</button>
        </div>
      ))}
      <button onClick={() => setOpts([...opts, ''])} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add option</button>
    </div>
  )
}

// ─── True/False Editor ────────────────────────────────────────────────────────
function TrueFalseEditor({ item, onUpdate }: { item: QItem; onUpdate:(p:any)=>void }) {
  return (
    <div className="flex gap-4">
      {['true', 'false'].map(v => (
        <label key={v} className={`flex items-center gap-3 flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${item.correctAnswer === v ? (v==='true' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-200 hover:border-gray-300'}`}>
          <input type="radio" name={`tf-${item.tempId}`} value={v} checked={item.correctAnswer === v}
            onChange={() => onUpdate({ correctAnswer: v })} className="accent-blue-600" />
          <span className="font-semibold text-sm capitalize">{v === 'true' ? '✓ True' : '✗ False'}</span>
        </label>
      ))}
    </div>
  )
}

// ─── Short/Long Answer Editor ─────────────────────────────────────────────────
function SimpleAnswerEditor({ item, onUpdate }: { item: QItem; onUpdate:(p:any)=>void }) {
  const isEssay = item.type === 'ESSAY'
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {isEssay ? 'Grading Rubric' : 'Model Answer / Answer Key'}
        </label>
        <textarea
          rows={isEssay ? 4 : 2} className="input-field text-sm resize-y"
          placeholder={isEssay ? 'Describe grading criteria, e.g. "Clear thesis (2pts), Evidence (3pts)…"' : 'Enter the expected answer…'}
          value={item.rubric || item.correctAnswer || ''}
          onChange={e => isEssay ? onUpdate({ rubric: e.target.value }) : onUpdate({ correctAnswer: e.target.value })}
        />
      </div>
    </div>
  )
}

// ─── Fill Text Editor ─────────────────────────────────────────────────────────
function FillTextEditor({ item, onUpdate }: { item: QItem; onUpdate:(p:any)=>void }) {
  const blanks: string[] = item.config?.blanks ?? []
  const blankCount = (item.content.match(/___/g) ?? []).length

  // Keep blanks array in sync with content
  const syncBlanks = (content: string, existingBlanks: string[]) => {
    const count = (content.match(/___/g) ?? []).length
    const updated = Array.from({ length: count }, (_, i) => existingBlanks[i] ?? '')
    onUpdate({ content, config: { blanks: updated } })
  }

  return (
    <div className="space-y-3">
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700">
        Use <code className="bg-yellow-100 px-1 rounded">___</code> (three underscores) to mark each blank in the question text above.
      </div>
      {blankCount > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Correct Answers</label>
          <div className="space-y-2">
            {Array.from({ length: blankCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">Blank {i+1}</span>
                <input
                  className="input-field text-sm flex-1"
                  placeholder={`Answer for blank ${i+1}`}
                  value={blanks[i] ?? ''}
                  onChange={e => {
                    const next = [...blanks]; next[i] = e.target.value
                    onUpdate({ config: { blanks: next } })
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400">Detected blanks: {blankCount}</p>
    </div>
  )
}

// ─── Fill Dropdown Editor ─────────────────────────────────────────────────────
function FillDropdownEditor({ item, onUpdate }: { item: QItem; onUpdate:(p:any)=>void }) {
  const blanks: { options: string[]; correct: string }[] = item.config?.blanks ?? []
  const setBlank = (i: number, patch: any) => {
    const next = [...blanks]; next[i] = { ...next[i], ...patch }
    onUpdate({ config: { blanks: next } })
  }
  return (
    <div className="space-y-3">
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700">
        Use <code className="bg-yellow-100 px-1 rounded">[[1]]</code>, <code className="bg-yellow-100 px-1 rounded">[[2]]</code> etc. in question text to mark dropdown positions.
      </div>
      <div className="space-y-4">
        {blanks.map((blank, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Blank {i+1}</span>
              <button onClick={() => onUpdate({ config: { blanks: blanks.filter((_,j)=>j!==i) } })} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            </div>
            <div className="space-y-2">
              {blank.options.map((opt, j) => (
                <div key={j} className="flex items-center gap-2">
                  <input type="radio" name={`dd-${item.tempId}-${i}`} checked={blank.correct === opt}
                    onChange={() => setBlank(i, { correct: opt })} className="accent-blue-600" />
                  <input className={`input-field text-sm flex-1 ${blank.correct === opt ? 'border-green-400 bg-green-50' : ''}`}
                    placeholder={`Option ${j+1}`} value={opt}
                    onChange={e => { const o=[...blank.options]; o[j]=e.target.value; setBlank(i, { options: o }) }} />
                  <button onClick={() => setBlank(i, { options: blank.options.filter((_,k)=>k!==j) })} className="text-gray-300 hover:text-red-500">✕</button>
                </div>
              ))}
              <button onClick={() => setBlank(i, { options: [...blank.options, ''] })} className="text-xs text-blue-600 hover:text-blue-800">+ Add option</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => onUpdate({ config: { blanks: [...blanks, { options: ['',''], correct: '' }] } })}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add blank</button>
    </div>
  )
}

// ─── Match Editor ─────────────────────────────────────────────────────────────
function MatchEditor({ item, onUpdate }: { item: QItem; onUpdate:(p:any)=>void }) {
  const pairs: { left: string; right: string }[] = item.config?.pairs ?? [{ left:'', right:'' }]
  const update = (i:number, side:'left'|'right', val:string) => {
    const next = [...pairs]; next[i] = { ...next[i], [side]: val }
    onUpdate({ config: { pairs: next } })
  }
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Match pairs (left ↔ right)</label>
      <div className="space-y-2">
        {pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="input-field text-sm flex-1" placeholder={`Left ${i+1}`} value={p.left} onChange={e=>update(i,'left',e.target.value)} />
            <span className="text-gray-400 shrink-0">⇔</span>
            <input className="input-field text-sm flex-1" placeholder={`Right ${i+1}`} value={p.right} onChange={e=>update(i,'right',e.target.value)} />
            <button onClick={()=>onUpdate({ config:{ pairs:pairs.filter((_,j)=>j!==i) } })} className="text-gray-300 hover:text-red-500 shrink-0">✕</button>
          </div>
        ))}
      </div>
      <button onClick={()=>onUpdate({ config:{ pairs:[...pairs, { left:'', right:'' }] } })} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add pair</button>
    </div>
  )
}

// ─── Sort Editor ──────────────────────────────────────────────────────────────
function SortEditor({ item, onUpdate }: { item: QItem; onUpdate:(p:any)=>void }) {
  const sortItems: string[] = item.config?.items ?? ['', '']
  return (
    <div className="space-y-3">
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-700">
        Enter items in the correct order. Students will see them shuffled.
      </div>
      <div className="space-y-2">
        {sortItems.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
            <input className="input-field text-sm flex-1" placeholder={`Item ${i+1}`} value={it}
              onChange={e=>{const n=[...sortItems];n[i]=e.target.value;onUpdate({config:{items:n}})}} />
            <button onClick={()=>onUpdate({config:{items:sortItems.filter((_,j)=>j!==i)}})} className="text-gray-300 hover:text-red-500">✕</button>
          </div>
        ))}
      </div>
      <button onClick={()=>onUpdate({config:{items:[...sortItems,'']}})} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add item</button>
    </div>
  )
}

// ─── Classify Editor ──────────────────────────────────────────────────────────
function ClassifyEditor({ item, onUpdate }: { item: QItem; onUpdate:(p:any)=>void }) {
  const cats: string[] = item.config?.categories ?? ['Category A', 'Category B']
  const clItems: { text: string; category: string }[] = item.config?.items ?? []
  const update = (patch: any) => onUpdate({ config: { categories: cats, items: clItems, ...patch } })
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {cats.map((c,i)=>(
            <div key={i} className="flex items-center gap-1">
              <input className="input-field text-sm w-36" value={c} onChange={e=>{const n=[...cats];n[i]=e.target.value;update({categories:n})}} />
              <button onClick={()=>update({categories:cats.filter((_,j)=>j!==i)})} className="text-gray-300 hover:text-red-500 text-sm">✕</button>
            </div>
          ))}
          <button onClick={()=>update({categories:[...cats,'']})} className="text-sm text-blue-600 hover:text-blue-800 px-2">+ Category</button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</label>
        <div className="space-y-2">
          {clItems.map((it,i)=>(
            <div key={i} className="flex items-center gap-2">
              <input className="input-field text-sm flex-1" placeholder="Item text" value={it.text}
                onChange={e=>{const n=[...clItems];n[i]={...n[i],text:e.target.value};update({items:n})}} />
              <select className="input-field text-sm w-40" value={it.category}
                onChange={e=>{const n=[...clItems];n[i]={...n[i],category:e.target.value};update({items:n})}}>
                <option value="">Category…</option>
                {cats.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={()=>update({items:clItems.filter((_,j)=>j!==i)})} className="text-gray-300 hover:text-red-500">✕</button>
            </div>
          ))}
        </div>
        <button onClick={()=>update({items:[...clItems,{text:'',category:cats[0]??''}]})} className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 block">+ Add item</button>
      </div>
    </div>
  )
}

// ─── Table Editor ─────────────────────────────────────────────────────────────
function TableEditor({ item, onUpdate }: { item: QItem; onUpdate:(p:any)=>void }) {
  const headers: string[] = item.config?.headers ?? ['Column 1', 'Column 2']
  const rows: string[][] = item.config?.rows ?? [['', '']]
  const update = (patch: any) => onUpdate({ config: { headers, rows, ...patch } })
  return (
    <div className="space-y-3 overflow-x-auto">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Table structure</label>
      <table className="min-w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
        <thead>
          <tr>
            {headers.map((h,i)=>(
              <th key={i} className="bg-gray-50 border-b border-gray-200 p-2">
                <input className="w-full bg-transparent font-semibold text-center outline-none" value={h}
                  onChange={e=>{const n=[...headers];n[i]=e.target.value;update({headers:n})}} />
              </th>
            ))}
            <th className="bg-gray-50 border-b border-gray-200 p-2 w-8">
              <button onClick={()=>{update({headers:[...headers,''],rows:rows.map(r=>[...r,''])})}} className="text-blue-600 hover:text-blue-800">+</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row,ri)=>(
            <tr key={ri}>
              {row.map((cell,ci)=>(
                <td key={ci} className="border-b border-gray-100 p-1">
                  <input className="w-full input-field text-sm border-0 bg-transparent" value={cell}
                    onChange={e=>{const n=rows.map(r=>[...r]);n[ri][ci]=e.target.value;update({rows:n})}} />
                </td>
              ))}
              <td className="border-b border-gray-100 p-1 text-center">
                <button onClick={()=>update({rows:rows.filter((_,j)=>j!==ri)})} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={()=>update({rows:[...rows,Array(headers.length).fill('')]})} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add row</button>
    </div>
  )
}

// ─── Tag Editor ───────────────────────────────────────────────────────────────
function TagEditor({ tags, onChange }: { tags: string[]; onChange: (t:string[])=>void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim()
    if (t && !tags.includes(t)) { onChange([...tags, t]); setInput('') }
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags <span className="font-normal">(optional)</span></label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(t=>(
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
            {t}
            <button onClick={()=>onChange(tags.filter(x=>x!==t))} className="text-gray-400 hover:text-red-500 ml-0.5">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="input-field text-sm flex-1" placeholder="Add tag…" value={input}
          onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),add())} />
        <button onClick={add} className="btn-secondary text-sm px-3">Add</button>
      </div>
    </div>
  )
}

// ─── Block Editor ─────────────────────────────────────────────────────────────
function BlockEditor({ item, onUpdate }: { item: BItem; onUpdate:(p:any)=>void }) {
  const c = item.content
  const set = (patch: any) => onUpdate({ content: { ...c, ...patch } })

  if (item.blockType === 'TEXT') return (
    <div className="pt-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Text / Instructions</label>
      <textarea rows={6} className="input-field text-sm resize-y" placeholder="Write instructions, text or context for students…"
        value={c.text ?? ''} onChange={e=>set({ text: e.target.value })} />
    </div>
  )

  if (item.blockType === 'ACCORDION') return (
    <div className="pt-4 space-y-3">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Accordion Sections</label>
      {(c.sections ?? []).map((sec: any, i: number) => (
        <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <input className="input-field text-sm flex-1 mr-2" placeholder="Section title" value={sec.title}
              onChange={e=>{const s=[...c.sections];s[i]={...s[i],title:e.target.value};set({sections:s})}} />
            <button onClick={()=>set({sections:c.sections.filter((_:any,j:number)=>j!==i)})} className="text-gray-300 hover:text-red-500">✕</button>
          </div>
          <textarea rows={3} className="input-field text-sm resize-y" placeholder="Section content"
            value={sec.body} onChange={e=>{const s=[...c.sections];s[i]={...s[i],body:e.target.value};set({sections:s})}} />
        </div>
      ))}
      <button onClick={()=>set({sections:[...(c.sections??[]),{title:'',body:''}]})} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add section</button>
    </div>
  )

  if (item.blockType === 'IMAGE') return (
    <div className="pt-4 space-y-3">
      <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
        <input className="input-field text-sm" placeholder="https://…" value={c.url??''} onChange={e=>set({url:e.target.value})} /></div>
      <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Caption</label>
        <input className="input-field text-sm" placeholder="Optional caption" value={c.caption??''} onChange={e=>set({caption:e.target.value})} /></div>
      {c.url && <img src={c.url} alt={c.alt??''} className="rounded-xl max-h-48 object-contain border border-gray-200" />}
    </div>
  )

  if (item.blockType === 'VIDEO') return (
    <div className="pt-4 space-y-3">
      <div className="flex gap-3">
        {['youtube','upload'].map(v=>(
          <label key={v} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${c.videoType===v?'border-blue-400 bg-blue-50 text-blue-700':'border-gray-200 text-gray-600'}`}>
            <input type="radio" name={`vt-${item.tempId}`} value={v} checked={c.videoType===v} onChange={()=>set({videoType:v})} className="accent-blue-600" />
            {v === 'youtube' ? '▶ YouTube URL' : '⬆ Upload URL'}
          </label>
        ))}
      </div>
      <input className="input-field text-sm" placeholder={c.videoType==='youtube'?'https://youtube.com/watch?v=…':'https://…'} value={c.url??''} onChange={e=>set({url:e.target.value})} />
    </div>
  )

  if (item.blockType === 'PDF') return (
    <div className="pt-4 space-y-3">
      <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PDF URL</label>
        <input className="input-field text-sm" placeholder="https://…/document.pdf" value={c.url??''} onChange={e=>set({url:e.target.value})} /></div>
      <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Title</label>
        <input className="input-field text-sm" placeholder="Document title" value={c.title??''} onChange={e=>set({title:e.target.value})} /></div>
    </div>
  )

  if (item.blockType === 'EMBED') return (
    <div className="pt-4 space-y-3">
      <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Embed HTML / iframe</label>
        <textarea rows={4} className="input-field text-sm font-mono resize-y" placeholder='<iframe src="…" …></iframe>'
          value={c.html??''} onChange={e=>set({html:e.target.value})} /></div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500">Height (px)</label>
        <input type="number" className="input-field w-24 text-sm" value={c.height??400} onChange={e=>set({height:Number(e.target.value)})} />
      </div>
    </div>
  )

  // Generic fallback for AUDIO, SIMULATION, DOCUMENT, PPT
  return (
    <div className="pt-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">URL</label>
      <input className="input-field text-sm" placeholder="https://…" value={c.url??''} onChange={e=>set({url:e.target.value})} />
    </div>
  )
}
