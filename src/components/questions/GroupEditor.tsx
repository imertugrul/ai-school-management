'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
export type SubQType =
  | 'MULTIPLE_CHOICE' | 'MCQ_MULTIPLE' | 'TRUE_FALSE'
  | 'SHORT_ANSWER' | 'ESSAY'
  | 'FILL_TEXT' | 'FILL_DROPDOWN'
  | 'MATCH' | 'SORT' | 'CLASSIFY' | 'TABLE'

export interface SubQuestion {
  id: string
  type: SubQType
  content: string
  points: number
  options?: string[]
  correctAnswer?: string
  config?: any
  rubric?: string
}

export interface GroupConfig {
  type: 'group'
  context: string
  contextImage?: string
  subQuestions: SubQuestion[]
}

interface Props {
  config?: GroupConfig
  onChange: (cfg: GroupConfig) => void
  onPointsChange?: (total: number) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SUB_TYPES: { value: SubQType; label: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'MCQ (Tek)' },
  { value: 'MCQ_MULTIPLE',    label: 'MCQ (Çoklu)' },
  { value: 'TRUE_FALSE',      label: 'Doğru / Yanlış' },
  { value: 'SHORT_ANSWER',    label: 'Kısa Cevap' },
  { value: 'ESSAY',           label: 'Uzun Cevap' },
  { value: 'FILL_TEXT',       label: 'Boşluk Doldur' },
  { value: 'FILL_DROPDOWN',   label: 'Açılır Menü' },
  { value: 'MATCH',           label: 'Eşleştir' },
  { value: 'SORT',            label: 'Sırala' },
  { value: 'CLASSIFY',        label: 'Sınıflandır' },
  { value: 'TABLE',           label: 'Tablo' },
]

const uid = () => Math.random().toString(36).slice(2, 8)

function defaultSubQ(type: SubQType): SubQuestion {
  return {
    id: uid(), type, content: '', points: 5,
    options: (type === 'MULTIPLE_CHOICE' || type === 'MCQ_MULTIPLE') ? ['', '', '', ''] : undefined,
    correctAnswer: '',
  }
}

const defaults: GroupConfig = {
  type: 'group',
  context: '',
  subQuestions: [],
}

// ─── Compact sub-question editor ─────────────────────────────────────────────
function SubEditor({ sq, idx, onChange, onRemove, onMove, total }:
  { sq: SubQuestion; idx: number; onChange: (p: Partial<SubQuestion>) => void; onRemove: () => void; onMove: (dir: -1|1) => void; total: number }) {

  const [open, setOpen] = useState(true)

  const opts = sq.options ?? ['', '', '', '']
  const setOpts = (o: string[]) => onChange({ options: o })

  const multiAnswers: string[] = (() => {
    if (sq.type !== 'MCQ_MULTIPLE') return []
    try { return JSON.parse(sq.correctAnswer ?? '[]') } catch { return [] }
  })()

  function toggleCorrect(opt: string) {
    if (sq.type === 'MCQ_MULTIPLE') {
      const next = multiAnswers.includes(opt) ? multiAnswers.filter(x => x !== opt) : [...multiAnswers, opt]
      onChange({ correctAnswer: JSON.stringify(next) })
    } else {
      onChange({ correctAnswer: opt })
    }
  }

  const blanks: string[] = sq.config?.blanks ?? []

  return (
    <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
        <button type="button" onClick={() => setOpen(v => !v)}
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600">
          {open ? '▾' : '▸'}
        </button>
        <span className="text-xs font-semibold text-gray-500 w-5">{idx + 1}.</span>
        <select value={sq.type}
          onChange={e => {
            const t = e.target.value as SubQType
            const d = defaultSubQ(t)
            onChange({ type: t, options: d.options, correctAnswer: '', config: undefined })
          }}
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white flex-1 max-w-[160px]">
          {SUB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <input type="number" min="0" value={sq.points}
            onChange={e => onChange({ points: parseInt(e.target.value) || 0 })}
            className="w-14 text-xs border border-gray-200 rounded px-2 py-1 text-center" />
          <span className="text-xs text-gray-400">pt</span>
          <button type="button" onClick={() => onMove(-1)} disabled={idx === 0}
            className="w-6 h-6 text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={idx === total - 1}
            className="w-6 h-6 text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">↓</button>
          <button type="button" onClick={onRemove}
            className="w-6 h-6 text-red-400 hover:text-red-600 text-sm leading-none">×</button>
        </div>
      </div>

      {open && (
        <div className="p-3 space-y-3">
          {/* Question text */}
          <textarea rows={2} className="input-field text-sm resize-y w-full"
            placeholder="Soru metni..."
            value={sq.content}
            onChange={e => onChange({ content: e.target.value })} />

          {/* MCQ options */}
          {(sq.type === 'MULTIPLE_CHOICE' || sq.type === 'MCQ_MULTIPLE') && (
            <div className="space-y-2">
              {opts.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  {sq.type === 'MCQ_MULTIPLE' ? (
                    <input type="checkbox" checked={multiAnswers.includes(opt)} onChange={() => toggleCorrect(opt)}
                      className="rounded accent-blue-600" />
                  ) : (
                    <input type="radio" name={`sq-${sq.id}`} checked={sq.correctAnswer === opt}
                      onChange={() => toggleCorrect(opt)} className="accent-blue-600" />
                  )}
                  <input className={`input-field text-sm flex-1 py-1 ${(sq.type === 'MCQ_MULTIPLE' ? multiAnswers.includes(opt) : sq.correctAnswer === opt) ? 'border-green-400 bg-green-50' : ''}`}
                    placeholder={`Seçenek ${i + 1}`} value={opt}
                    onChange={e => { const n = [...opts]; n[i] = e.target.value; setOpts(n) }} />
                  <button type="button" onClick={() => setOpts(opts.filter((_, j) => j !== i))}
                    className="text-gray-300 hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => setOpts([...opts, ''])}
                className="text-xs text-blue-600 hover:underline">+ Seçenek ekle</button>
            </div>
          )}

          {/* True/False */}
          {sq.type === 'TRUE_FALSE' && (
            <div className="flex gap-3">
              {['true', 'false'].map(v => (
                <label key={v} className={`flex items-center gap-2 flex-1 p-2 rounded-lg border-2 cursor-pointer text-sm ${sq.correctAnswer === v ? (v === 'true' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-200'}`}>
                  <input type="radio" name={`tf-${sq.id}`} value={v} checked={sq.correctAnswer === v}
                    onChange={() => onChange({ correctAnswer: v })} className="accent-blue-600" />
                  <span className="font-medium">{v === 'true' ? '✓ Doğru' : '✗ Yanlış'}</span>
                </label>
              ))}
            </div>
          )}

          {/* Short / Essay */}
          {(sq.type === 'SHORT_ANSWER' || sq.type === 'ESSAY') && (
            <input type="text" className="input-field text-sm"
              placeholder={sq.type === 'ESSAY' ? 'Rubric / Değerlendirme kriteri...' : 'Beklenen cevap...'}
              value={sq.type === 'ESSAY' ? (sq.rubric ?? '') : (sq.correctAnswer ?? '')}
              onChange={e => sq.type === 'ESSAY' ? onChange({ rubric: e.target.value }) : onChange({ correctAnswer: e.target.value })} />
          )}

          {/* Fill Text */}
          {sq.type === 'FILL_TEXT' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Soru metninde boşluklar için <code className="bg-gray-100 px-1 rounded">___</code> kullan.</p>
              {(sq.content.match(/___/g) ?? []).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-14">Boşluk {i + 1}</span>
                  <input className="input-field text-sm flex-1 py-1"
                    placeholder={`Boşluk ${i + 1} cevabı`}
                    value={blanks[i] ?? ''}
                    onChange={e => { const n = [...blanks]; n[i] = e.target.value; onChange({ config: { blanks: n } }) }} />
                </div>
              ))}
            </div>
          )}

          {/* Other types — show a note */}
          {(['FILL_DROPDOWN', 'MATCH', 'SORT', 'CLASSIFY', 'TABLE'] as SubQType[]).includes(sq.type) && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Doğru Cevap</label>
              <textarea rows={2} className="input-field text-sm resize-y"
                placeholder="Doğru cevap veya rubric girin..."
                value={sq.correctAnswer ?? ''}
                onChange={e => onChange({ correctAnswer: e.target.value })} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main GroupEditor ─────────────────────────────────────────────────────────
export default function GroupEditor({ config, onChange, onPointsChange }: Props) {
  const cfg = config ?? defaults

  function u(patch: Partial<GroupConfig>) {
    const next = { ...cfg, ...patch }
    onChange(next)
    if (patch.subQuestions || !patch) {
      const total = (patch.subQuestions ?? cfg.subQuestions).reduce((s, q) => s + q.points, 0)
      onPointsChange?.(total)
    }
  }

  function updateSub(id: string, patch: Partial<SubQuestion>) {
    const next = cfg.subQuestions.map(sq => sq.id === id ? { ...sq, ...patch } : sq)
    u({ subQuestions: next })
  }

  function removeSub(id: string) {
    u({ subQuestions: cfg.subQuestions.filter(sq => sq.id !== id) })
  }

  function moveSub(idx: number, dir: -1 | 1) {
    const arr = [...cfg.subQuestions]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    u({ subQuestions: arr })
  }

  function addSub() {
    u({ subQuestions: [...cfg.subQuestions, defaultSubQ('MULTIPLE_CHOICE')] })
  }

  const totalPoints = cfg.subQuestions.reduce((s, q) => s + q.points, 0)

  return (
    <div className="space-y-5">
      {/* Context */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Bağlam / Giriş Metni
        </label>
        <textarea rows={4} className="input-field text-sm resize-y"
          placeholder="Öğrencilerin okuması / incelemesi gereken metin, talimat veya açıklama..."
          value={cfg.context}
          onChange={e => u({ context: e.target.value })} />
      </div>

      {/* Context image */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Görsel (opsiyonel)
        </label>
        <input type="text" className="input-field text-sm"
          placeholder="https://... (görsel URL)"
          value={cfg.contextImage ?? ''}
          onChange={e => u({ contextImage: e.target.value || undefined })} />
        {cfg.contextImage && (
          <img src={cfg.contextImage} alt="context" className="mt-2 max-h-40 rounded-lg border border-gray-200 object-contain" />
        )}
      </div>

      <hr className="border-gray-200" />

      {/* Sub-questions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Alt Sorular ({cfg.subQuestions.length})
          </label>
          <span className="text-xs text-gray-500">Toplam: <strong>{totalPoints} puan</strong></span>
        </div>

        <div className="space-y-3">
          {cfg.subQuestions.map((sq, i) => (
            <SubEditor
              key={sq.id}
              sq={sq}
              idx={i}
              total={cfg.subQuestions.length}
              onChange={patch => updateSub(sq.id, patch)}
              onRemove={() => removeSub(sq.id)}
              onMove={dir => moveSub(i, dir)}
            />
          ))}
        </div>

        <button type="button" onClick={addSub}
          className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-medium hover:border-slate-400 hover:text-slate-700 transition-colors">
          + Alt Soru Ekle
        </button>
      </div>

      {totalPoints > 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
          Toplam puan otomatik güncellendi: <strong>{totalPoints} puan</strong>
        </div>
      )}
    </div>
  )
}
