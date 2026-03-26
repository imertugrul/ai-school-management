'use client'

import { useRef, useState } from 'react'
import { HotspotConfig, HotspotArea } from './HotspotEditor'

interface Props {
  config: HotspotConfig
  value: string
  onChange: (v: string) => void
}

function isInHotspot(area: HotspotArea, px: number, py: number): boolean {
  if (area.shape === 'circle') {
    const dx = px - (area.cx ?? 0)
    const dy = py - (area.cy ?? 0)
    return Math.sqrt(dx * dx + dy * dy) <= (area.r ?? 8)
  }
  // rect
  return px >= (area.x ?? 0) && px <= (area.x ?? 0) + (area.w ?? 0) &&
         py >= (area.y ?? 0) && py <= (area.y ?? 0) + (area.h ?? 0)
}

export default function HotspotStudent({ config, value, onChange }: Props) {
  const [selected, setSelected] = useState<string[]>(() => {
    try { return JSON.parse(value) } catch { return [] }
  })
  const [flash, setFlash] = useState<{ x: number; y: number; correct: boolean } | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top)  / rect.height) * 100

    // Find hit hotspot
    const hit = config.hotspots.find(h => isInHotspot(h, px, py))

    if (hit) {
      let next: string[]
      if (config.requireAll) {
        // Toggle individual hotspots
        next = selected.includes(hit.id)
          ? selected.filter(id => id !== hit.id)
          : [...selected, hit.id]
      } else {
        // Single selection
        next = selected.includes(hit.id) ? [] : [hit.id]
      }
      setSelected(next)
      onChange(JSON.stringify(next))
      if (config.showFeedback) {
        setFlash({ x: px, y: py, correct: true })
        setTimeout(() => setFlash(null), 700)
      }
    } else if (config.showFeedback) {
      setFlash({ x: px, y: py, correct: false })
      setTimeout(() => setFlash(null), 700)
    }
  }

  const allCorrect = config.requireAll
    ? config.hotspots.every(h => selected.includes(h.id))
    : selected.length > 0

  return (
    <div className="space-y-3">
      <div
        ref={imgRef}
        className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm cursor-crosshair select-none"
        onClick={handleClick}
      >
        <img src={config.backgroundImage} alt="background" className="w-full block pointer-events-none" draggable={false} />

        {/* Hotspot overlays (visible after correct click) */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {config.hotspots.map(h => {
            const isHit = selected.includes(h.id)
            const fill  = isHit ? 'rgba(34,197,94,0.4)'  : 'rgba(0,0,0,0)'
            const stroke = isHit ? '#16a34a' : 'rgba(0,0,0,0)'
            return h.shape === 'circle'
              ? <circle key={h.id} cx={h.cx} cy={h.cy} r={h.r} fill={fill} stroke={stroke} strokeWidth="0.5" />
              : <rect key={h.id} x={h.x} y={h.y} width={h.w} height={h.h} fill={fill} stroke={stroke} strokeWidth="0.5" />
          })}
        </svg>

        {/* Click flash feedback */}
        {flash && (
          <div
            className="absolute pointer-events-none"
            style={{ left: `${flash.x}%`, top: `${flash.y}%`, transform: 'translate(-50%,-50%)' }}
          >
            <span className={`text-lg font-bold ${flash.correct ? 'text-emerald-500' : 'text-red-500'}`}>
              {flash.correct ? '✓' : '✗'}
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        {config.requireAll
          ? `${selected.length} / ${config.hotspots.length} alan seçildi`
          : selected.length > 0 ? '✓ Seçim yapıldı' : 'Doğru alana tıkla'}
        {allCorrect && config.requireAll && <span className="ml-1 text-emerald-600 font-medium">✓ Tamamlandı!</span>}
      </div>
    </div>
  )
}
