'use client'

import { useRef, useState } from 'react'
import { LabelDragConfig, LabelDragLabel } from './LabelDragEditor'

interface Props {
  config: LabelDragConfig
  value: string
  onChange: (v: string) => void
}

interface Placement { x: number; y: number }
type Placements = Record<string, Placement>

function parse(v: string): Placements {
  try { return JSON.parse(v) } catch { return {} }
}

export default function LabelDragStudent({ config, value, onChange }: Props) {
  const [placements, setPlacements] = useState<Placements>(() => parse(value))
  const [dragging, setDragging] = useState<string | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  function save(p: Placements) {
    setPlacements(p)
    onChange(JSON.stringify(p))
  }

  function handleDragStart(id: string, e: React.DragEvent) {
    setDragging(id)
    e.dataTransfer.setData('labelId', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const id = e.dataTransfer.getData('labelId')
    if (!id || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    save({ ...placements, [id]: { x, y } })
    setDragging(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Touch drag support
  const touchLabel = useRef<string | null>(null)

  function handleTouchStart(id: string) {
    touchLabel.current = id
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const id = touchLabel.current
    if (!id || !imgRef.current) return
    const touch = e.changedTouches[0]
    const rect = imgRef.current.getBoundingClientRect()
    const x = Math.round(((touch.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((touch.clientY - rect.top) / rect.height) * 100)
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      save({ ...placements, [id]: { x, y } })
    }
    touchLabel.current = null
  }

  function removePlacement(id: string) {
    const next = { ...placements }
    delete next[id]
    save(next)
  }

  const placed    = config.labels.filter(l => placements[l.id])
  const unplaced  = config.labels.filter(l => !placements[l.id])

  return (
    <div className="space-y-4">
      {/* Image drop zone */}
      <div
        ref={imgRef}
        className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 select-none"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onTouchEnd={handleTouchEnd}
      >
        <img src={config.backgroundImage} alt="background" className="w-full block pointer-events-none" draggable={false} />
        {/* Placed labels */}
        {placed.map(l => (
          <div
            key={l.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg cursor-grab active:cursor-grabbing whitespace-nowrap border-2 border-white"
            style={{ left: `${placements[l.id].x}%`, top: `${placements[l.id].y}%` }}
            draggable
            onDragStart={e => handleDragStart(l.id, e)}
            onTouchStart={() => handleTouchStart(l.id)}
          >
            {l.text}
            <button type="button" className="ml-1 opacity-70 hover:opacity-100" onClick={() => removePlacement(l.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Unplaced labels tray */}
      {unplaced.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Etiketleri görselin üzerine sürükle:</p>
          <div className="flex flex-wrap gap-2">
            {unplaced.map(l => (
              <div
                key={l.id}
                draggable
                onDragStart={e => handleDragStart(l.id, e)}
                onTouchStart={() => handleTouchStart(l.id)}
                className="px-3 py-1.5 bg-gray-100 border-2 border-gray-300 rounded-full text-sm font-medium text-gray-700 cursor-grab active:cursor-grabbing select-none hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                {l.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {placed.length === config.labels.length && (
        <p className="text-xs text-emerald-600">✓ Tüm etiketler yerleştirildi</p>
      )}
    </div>
  )
}
