'use client'

import { useRef, useState } from 'react'

export interface LabelDragLabel {
  id: string
  text: string
  correctX: number
  correctY: number
}

export interface LabelDragConfig {
  type: 'label_drag'
  backgroundImage: string
  labels: LabelDragLabel[]
  tolerance: number
}

interface Props {
  config?: LabelDragConfig
  onChange: (cfg: LabelDragConfig) => void
}

const defaults: LabelDragConfig = {
  type: 'label_drag',
  backgroundImage: '',
  labels: [],
  tolerance: 10,
}

const uid = () => Math.random().toString(36).slice(2, 8)

export default function LabelDragEditor({ config, onChange }: Props) {
  const cfg = config ?? defaults
  const u = (p: Partial<LabelDragConfig>) => onChange({ ...cfg, ...p })

  const [placingId, setPlacingId] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const imgRef = useRef<HTMLDivElement>(null)

  function addLabel() {
    const text = newText.trim()
    if (!text) return
    const newLabel: LabelDragLabel = { id: uid(), text, correctX: 50, correctY: 50 }
    u({ labels: [...cfg.labels, newLabel] })
    setNewText('')
    setPlacingId(newLabel.id)
  }

  function removeLabel(id: string) {
    u({ labels: cfg.labels.filter(l => l.id !== id) })
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!placingId || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    u({ labels: cfg.labels.map(l => l.id === placingId ? { ...l, correctX: x, correctY: y } : l) })
    setPlacingId(null)
  }

  return (
    <div className="space-y-5">
      {/* Background image */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Arka Plan Görseli <span className="text-red-500">*</span>
        </label>
        <input type="text" className="input-field text-sm"
          placeholder="https://... (görsel URL'si)"
          value={cfg.backgroundImage}
          onChange={e => u({ backgroundImage: e.target.value })} />
      </div>

      {/* Label placement on image */}
      {cfg.backgroundImage && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Etiket Konumları
          </label>
          {placingId && (
            <div className="mb-2 rounded-lg bg-blue-50 border border-blue-200 p-2 text-xs text-blue-700">
              🎯 Görsele tıkla → "<strong>{cfg.labels.find(l => l.id === placingId)?.text}</strong>" etiketinin doğru konumunu belirle
            </div>
          )}
          <div
            ref={imgRef}
            className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 cursor-crosshair select-none"
            onClick={handleImageClick}
          >
            <img src={cfg.backgroundImage} alt="background" className="w-full block" draggable={false} />
            {cfg.labels.map(l => (
              <div
                key={l.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-bold rounded-full border-2 whitespace-nowrap shadow ${l.id === placingId ? 'border-blue-500 bg-blue-100 text-blue-800' : 'border-emerald-500 bg-emerald-100 text-emerald-800'}`}
                style={{ left: `${l.correctX}%`, top: `${l.correctY}%`, pointerEvents: 'none' }}
              >
                {l.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labels list */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Etiketler</label>
        {cfg.labels.map(l => (
          <div key={l.id} className="flex items-center gap-2 mb-2">
            <span className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium">{l.text}</span>
            <span className="text-xs text-gray-400 font-mono">{l.correctX}%,{l.correctY}%</span>
            {cfg.backgroundImage && (
              <button type="button" onClick={() => setPlacingId(l.id)}
                className={`text-xs px-2 py-1 rounded ${placingId === l.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                📍
              </button>
            )}
            <button type="button" onClick={() => removeLabel(l.id)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">×</button>
          </div>
        ))}
        <div className="flex gap-2 mt-1">
          <input type="text" className="input-field flex-1 text-sm" placeholder="Yeni etiket metni"
            value={newText} onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLabel())} />
          <button type="button" onClick={addLabel} className="px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-medium">+ Ekle</button>
        </div>
      </div>

      {/* Tolerance */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tolerans (%)</label>
        <input type="number" min="1" max="30" className="input-field w-24 text-sm"
          value={cfg.tolerance} onChange={e => u({ tolerance: parseInt(e.target.value) || 10 })} />
        <p className="text-xs text-gray-400 mt-1">Öğrencinin doğru konumdan ±{cfg.tolerance}% uzaklıkta bırakması kabul edilir.</p>
      </div>
    </div>
  )
}
