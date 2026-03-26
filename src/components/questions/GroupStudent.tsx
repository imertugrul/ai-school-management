'use client'

import { useState } from 'react'
import { GroupConfig, SubQuestion, SubQType } from './GroupEditor'

interface Props {
  config: GroupConfig
  value: string
  onChange: (v: string) => void
}

type Answers = Record<string, string>

function parse(v: string): Answers {
  try { return JSON.parse(v) } catch { return {} }
}

// ─── Inline sub-question renderers ───────────────────────────────────────────
function SubStudentView({ sq, answer, onChange }: { sq: SubQuestion; answer: string; onChange: (v: string) => void }) {

  // MCQ Single
  if (sq.type === 'MULTIPLE_CHOICE') {
    return (
      <div className="space-y-2">
        {(sq.options ?? []).map((opt, i) => (
          <label key={i}
            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answer === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name={`sq-${sq.id}`} value={opt} checked={answer === opt}
              onChange={() => onChange(opt)} className="accent-blue-600" />
            <span className="text-sm text-gray-900">{opt}</span>
          </label>
        ))}
      </div>
    )
  }

  // MCQ Multiple
  if (sq.type === 'MCQ_MULTIPLE') {
    const selected: string[] = (() => { try { return JSON.parse(answer) } catch { return [] } })()
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]
      onChange(JSON.stringify(next))
    }
    return (
      <div className="space-y-2">
        {(sq.options ?? []).map((opt, i) => (
          <label key={i}
            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${selected.includes(opt) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="checkbox" value={opt} checked={selected.includes(opt)}
              onChange={() => toggle(opt)} className="rounded accent-blue-600" />
            <span className="text-sm text-gray-900">{opt}</span>
          </label>
        ))}
      </div>
    )
  }

  // True/False
  if (sq.type === 'TRUE_FALSE') {
    return (
      <div className="flex gap-3">
        {[{ v: 'true', label: '✓ Doğru' }, { v: 'false', label: '✗ Yanlış' }].map(({ v, label }) => (
          <label key={v}
            className={`flex items-center gap-2 flex-1 p-3 border-2 rounded-lg cursor-pointer transition-all ${answer === v ? (v === 'true' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name={`sq-${sq.id}`} value={v} checked={answer === v}
              onChange={() => onChange(v)} className="accent-blue-600" />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>
    )
  }

  // Short Answer
  if (sq.type === 'SHORT_ANSWER') {
    return (
      <input type="text" className="input-field" placeholder="Cevabınızı yazın..."
        value={answer} onChange={e => onChange(e.target.value)} />
    )
  }

  // Essay
  if (sq.type === 'ESSAY') {
    return (
      <textarea className="input-field" rows={5} placeholder="Cevabınızı yazın..."
        value={answer} onChange={e => onChange(e.target.value)} />
    )
  }

  // Fill Text
  if (sq.type === 'FILL_TEXT') {
    const blanks: string[] = sq.config?.blanks ?? []
    const blankCount = (sq.content.match(/___/g) ?? []).length
    const answerBlanks: string[] = (() => { try { return JSON.parse(answer) } catch { return [] } })()
    const updateBlank = (i: number, val: string) => {
      const next = Array.from({ length: blankCount }, (_, j) => answerBlanks[j] ?? '')
      next[i] = val
      onChange(JSON.stringify(next))
    }
    // Render sentence with inline inputs
    const parts = sq.content.split('___')
    return (
      <div className="flex flex-wrap items-center gap-1 text-sm text-gray-900">
        {parts.map((part, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span className="whitespace-pre-wrap">{part}</span>
            {i < parts.length - 1 && (
              <input type="text" className="inline-block border-b-2 border-blue-400 bg-blue-50 rounded px-2 py-0.5 text-sm min-w-[80px] focus:outline-none focus:border-blue-600"
                value={answerBlanks[i] ?? ''}
                onChange={e => updateBlank(i, e.target.value)} />
            )}
          </span>
        ))}
      </div>
    )
  }

  // Fallback for other types (Dropdown, Match, Sort, Classify, Table)
  return (
    <textarea className="input-field" rows={3} placeholder="Cevabınızı yazın..."
      value={answer} onChange={e => onChange(e.target.value)} />
  )
}

// ─── Main GroupStudent ────────────────────────────────────────────────────────
export default function GroupStudent({ config, value, onChange }: Props) {
  const [answers, setAnswers] = useState<Answers>(() => parse(value))

  function handleSubChange(id: string, val: string) {
    const next = { ...answers, [id]: val }
    setAnswers(next)
    onChange(JSON.stringify(next))
  }

  const answeredCount = config.subQuestions.filter(sq => {
    const a = answers[sq.id]
    return a && a.trim() !== '' && a !== '[]' && a !== '{}'
  }).length

  return (
    <div className="space-y-6">
      {/* Context block */}
      {(config.context || config.contextImage) && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          {config.context && (
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{config.context}</p>
          )}
          {config.contextImage && (
            <img src={config.contextImage} alt="context" className="max-w-full rounded-lg border border-slate-300" />
          )}
        </div>
      )}

      {/* Sub-questions */}
      <div className="space-y-6">
        {config.subQuestions.map((sq, i) => (
          <div key={sq.id} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Soru {i + 1}</span>
              <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                {sq.points} puan
              </span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-base text-gray-900 whitespace-pre-wrap">{sq.content}</p>
              <SubStudentView
                sq={sq}
                answer={answers[sq.id] ?? ''}
                onChange={v => handleSubChange(sq.id, v)}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-right">
        {answeredCount} / {config.subQuestions.length} soru yanıtlandı
        {answeredCount === config.subQuestions.length && <span className="ml-1 text-emerald-600">✓</span>}
      </p>
    </div>
  )
}
