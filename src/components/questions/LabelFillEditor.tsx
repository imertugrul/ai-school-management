'use client'

import { useRef, useState } from 'react'

export interface LabelFillLabel {
  id: string
  x: number
  y: number
  correctAnswers: string[]
  caseSensitive: boolean
}

export interface LabelFillConfig {
  type: 'label_fill'
  backgroundImage: string
  labels: LabelFillLabel[]
}

interface Props {
  config?: LabelFillConfig
  onChange: (cfg: LabelFillConfig) => void
}

const uid = () => Math.random().toString(36).slice(2, 8)

const defaults: LabelFillConfig = {
  type: 'label_fill',
  backgroundImage: '',
  labels: [],
}

export default function LabelFillEditor({ config, onChange }: Props) {
  const cfg = config ?? defaults
  const u = (p: Partial<LabelFillConfig>) => onChange({ ...cfg, ...p })

  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!adding || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    const newLabel: LabelFillLabel = { id: uid(), x, y, correctAnswers: [''], caseSensitive: false }
    u({ labels: [...cfg.labels, newLabel] })
    setAdding(false)
    setEditId(newLabel.id)
  }

  function updateLabel(id: string, patch: Partial<LabelFillLabel>) {
    u({ labels: cfg.labels.map(l => l.id === id ? { ...l, ...patch } : l) })
  }

  function removeLabel(id: string) {
    u({ labels: cfg.labels.filter(l => l.id !== id) })
    if (editId === id) setEditId(null)
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

      {/* Image with label points */}
      {cfg.backgroundImage && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Etiket Noktaları</label>
            <button type="button" onClick={() => setAdding(v => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium ${adding ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {adding ? '🎯 Görsele tıkla...' : '+ Nokta Ekle'}
            </button>
          </div>
          <div ref={imgRef}
            className={`relative rounded-xl overflow-hidden border-2 ${adding ? 'border-blue-400 cursor-crosshair' : 'border-gray-200'} select-none`}
            onClick={handleImageClick}>
            <img src={cfg.backgroundImage} alt="background" className="w-full block" draggable={false} />
            {cfg.labels.map((l, i) => (
              <button key={l.id} type="button"
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-xs font-bold text-white shadow-lg border-2 border-white ${editId === l.id ? 'bg-blue-500' : 'bg-rose-500'}`}
                style={{ left: `${l.x}%`, top: `${l.y}%` }}
                onClick={e => { e.stopPropagation(); setEditId(editId === l.id ? null : l.id) }}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Label edit panels */}
      {cfg.labels.map((l, i) => (
        <div key={l.id} className={`rounded-xl border-2 p-3 ${editId === l.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Nokta {i + 1} — ({l.x}%, {l.y}%)</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditId(editId === l.id ? null : l.id)}
                className="text-xs text-blue-600 hover:underline">{editId === l.id ? 'Kapat' : 'Düzenle'}</button>
              <button type="button" onClick={() => removeLabel(l.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
            </div>
          </div>
          {editId === l.id && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Doğru Cevap(lar) — virgülle ayır</label>
                <input type="text" className="input-field text-sm"
                  placeholder="Mitokondri, mitochondria, Mitokondri organeli"
                  value={l.correctAnswers.join(', ')}
                  onChange={e => updateLabel(l.id, { correctAnswers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={l.caseSensitive}
                  onChange={e => updateLabel(l.id, { caseSensitive: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Büyük/küçük harf duyarlı</span>
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
