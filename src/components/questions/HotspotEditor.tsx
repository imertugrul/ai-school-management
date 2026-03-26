'use client'

import { useRef, useState } from 'react'

export interface HotspotArea {
  id: string
  shape: 'circle' | 'rect'
  label?: string
  // circle
  cx?: number
  cy?: number
  r?: number
  // rect
  x?: number
  y?: number
  w?: number
  h?: number
}

export interface HotspotConfig {
  type: 'hotspot'
  backgroundImage: string
  hotspots: HotspotArea[]
  requireAll: boolean
  showFeedback: boolean
}

interface Props {
  config?: HotspotConfig
  onChange: (cfg: HotspotConfig) => void
}

const uid = () => Math.random().toString(36).slice(2, 8)

const defaults: HotspotConfig = {
  type: 'hotspot',
  backgroundImage: '',
  hotspots: [],
  requireAll: false,
  showFeedback: true,
}

export default function HotspotEditor({ config, onChange }: Props) {
  const cfg = config ?? defaults
  const u = (p: Partial<HotspotConfig>) => onChange({ ...cfg, ...p })

  const [addShape, setAddShape] = useState<'circle' | 'rect' | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!addShape || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const cx = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const cy = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    let area: HotspotArea
    if (addShape === 'circle') {
      area = { id: uid(), shape: 'circle', cx, cy, r: 8 }
    } else {
      area = { id: uid(), shape: 'rect', x: cx - 8, y: cy - 6, w: 16, h: 12 }
    }
    u({ hotspots: [...cfg.hotspots, area] })
    setAddShape(null)
  }

  function updateHotspot(id: string, patch: Partial<HotspotArea>) {
    u({ hotspots: cfg.hotspots.map(h => h.id === id ? { ...h, ...patch } : h) })
  }

  function removeHotspot(id: string) {
    u({ hotspots: cfg.hotspots.filter(h => h.id !== id) })
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

      {/* Image with hotspot overlay */}
      {cfg.backgroundImage && (
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hotspot Alanları</span>
            <button type="button" onClick={() => setAddShape(addShape === 'circle' ? null : 'circle')}
              className={`text-xs px-2 py-1 rounded-lg font-medium ${addShape === 'circle' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              ⭕ Daire Ekle
            </button>
            <button type="button" onClick={() => setAddShape(addShape === 'rect' ? null : 'rect')}
              className={`text-xs px-2 py-1 rounded-lg font-medium ${addShape === 'rect' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              ▭ Dikdörtgen Ekle
            </button>
            {addShape && <span className="text-xs text-orange-600">🎯 Görsele tıkla...</span>}
          </div>
          <div ref={imgRef}
            className={`relative rounded-xl overflow-hidden border-2 ${addShape ? 'border-orange-400 cursor-crosshair' : 'border-gray-200'} select-none`}
            onClick={handleImageClick}>
            <img src={cfg.backgroundImage} alt="bg" className="w-full block" draggable={false} />
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {cfg.hotspots.map(h => h.shape === 'circle' ? (
                <circle key={h.id} cx={h.cx} cy={h.cy} r={h.r} fill="rgba(249,115,22,0.35)" stroke="#f97316" strokeWidth="0.5" />
              ) : (
                <rect key={h.id} x={h.x} y={h.y} width={h.w} height={h.h} fill="rgba(249,115,22,0.35)" stroke="#f97316" strokeWidth="0.5" />
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Hotspot list */}
      {cfg.hotspots.length > 0 && (
        <div className="space-y-2">
          {cfg.hotspots.map((h, i) => (
            <div key={h.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-gray-500">#{i + 1} {h.shape === 'circle' ? `⭕ cx:${h.cx}% cy:${h.cy}% r:${h.r}%` : `▭ x:${h.x}% y:${h.y}% ${h.w}×${h.h}%`}</span>
              <input type="text" className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
                placeholder="Alan etiketi (opsiyonel)"
                value={h.label ?? ''}
                onChange={e => updateHotspot(h.id, { label: e.target.value })} />
              {h.shape === 'circle' && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">r:</span>
                  <input type="number" min="2" max="30" className="w-14 text-xs border border-gray-200 rounded px-1 py-0.5"
                    value={h.r ?? 8} onChange={e => updateHotspot(h.id, { r: parseInt(e.target.value) || 8 })} />
                </div>
              )}
              <button type="button" onClick={() => removeHotspot(h.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Options */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={cfg.requireAll} onChange={e => u({ requireAll: e.target.checked })} className="rounded" />
          <span className="text-sm text-gray-700">Tüm alanlar seçilmeli</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={cfg.showFeedback} onChange={e => u({ showFeedback: e.target.checked })} className="rounded" />
          <span className="text-sm text-gray-700">Anında geri bildirim</span>
        </label>
      </div>
    </div>
  )
}
