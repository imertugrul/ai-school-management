'use client'

import { useRef, useState, useEffect } from 'react'
import { DrawingConfig } from './DrawingEditor'

interface Props {
  config: DrawingConfig
  value: string
  onChange: (v: string) => void
}

const COLORS = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff']

export default function DrawingStudent({ config, value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [color, setColor]   = useState('#000000')
  const [brush, setBrush]   = useState(3)
  const [tool,  setTool]    = useState<'pen' | 'eraser'>('pen')
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Load background image once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (config.backgroundImage) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height) }
      img.src = config.backgroundImage
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.backgroundImage])

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const pos = getPos(e)
    if (!pos) return
    setDrawing(true)
    lastPos.current = pos
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing || !lastPos.current) return
    const pos = getPos(e)
    if (!pos) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineWidth   = tool === 'eraser' ? brush * 4 : brush
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing) return
    setDrawing(false)
    lastPos.current = null
    saveCanvas()
  }

  function saveCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(canvas.toDataURL('image/png'))
  }

  function clearCanvas() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (config.backgroundImage) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); saveCanvas() }
      img.src = config.backgroundImage
    } else {
      saveCanvas()
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap bg-gray-50 rounded-xl p-2 border border-gray-200">
        <button type="button" onClick={() => setTool('pen')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tool === 'pen' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
          ✏️ Kalem
        </button>
        <button type="button" onClick={() => setTool('eraser')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tool === 'eraser' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
          🧹 Silgi
        </button>
        <button type="button" onClick={clearCanvas}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
          🗑️ Temizle
        </button>
        {config.allowColors && (
          <div className="flex items-center gap-1.5">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => { setColor(c); setTool('pen') }}
                className={`w-6 h-6 rounded-full border-2 transition-all ${color === c && tool === 'pen' ? 'border-gray-800 scale-125' : 'border-gray-300'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
        {config.allowBrushSize && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Boyut:</span>
            <input type="range" min="1" max="20" value={brush}
              onChange={e => setBrush(parseInt(e.target.value))}
              className="w-20 accent-gray-700" />
            <span className="text-xs text-gray-600 w-5">{brush}</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm touch-none" style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}>
        <canvas
          ref={canvasRef}
          width={config.canvasWidth}
          height={config.canvasHeight}
          style={{ width: '100%', display: 'block', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {value && (
        <p className="text-xs text-emerald-600">✓ Çizim kaydedildi</p>
      )}
    </div>
  )
}
