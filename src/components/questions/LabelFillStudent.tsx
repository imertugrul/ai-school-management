'use client'

import { useState } from 'react'
import { LabelFillConfig } from './LabelFillEditor'

interface Props {
  config: LabelFillConfig
  value: string
  onChange: (v: string) => void
}

type Answers = Record<string, string>

function parse(v: string): Answers {
  try { return JSON.parse(v) } catch { return {} }
}

export default function LabelFillStudent({ config, value, onChange }: Props) {
  const [answers, setAnswers] = useState<Answers>(() => parse(value))

  function handleChange(id: string, val: string) {
    const next = { ...answers, [id]: val }
    setAnswers(next)
    onChange(JSON.stringify(next))
  }

  const filled = Object.values(answers).filter(v => v.trim()).length

  return (
    <div className="space-y-4">
      {/* Image with overlaid inputs */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm select-none">
        <img src={config.backgroundImage} alt="background" className="w-full block" draggable={false} />
        {config.labels.map((l, i) => (
          <div
            key={l.id}
            className="absolute"
            style={{ left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Number badge */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow">
                {i + 1}
              </span>
              <input
                type="text"
                className="text-xs border-2 border-rose-400 rounded px-1.5 py-0.5 bg-white/95 shadow min-w-[80px] text-center focus:outline-none focus:border-rose-600"
                placeholder="Yaz..."
                value={answers[l.id] ?? ''}
                onChange={e => handleChange(l.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        {filled} / {config.labels.length} alan dolduruldu
        {filled === config.labels.length && <span className="ml-1 text-emerald-600">✓</span>}
      </p>
    </div>
  )
}
