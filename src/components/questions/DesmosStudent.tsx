'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { DesmosConfig } from './DesmosEditor'

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (el: HTMLElement, opts?: object) => DesmosCalculator
      ScientificCalculator: (el: HTMLElement, opts?: object) => DesmosCalculator
      FourFunctionCalculator: (el: HTMLElement, opts?: object) => DesmosCalculator
      Geometry: (el: HTMLElement, opts?: object) => DesmosCalculator
    }
  }
}

interface DesmosCalculator {
  setExpression: (expr: { id: string; latex: string }) => void
  destroy: () => void
}

interface Props {
  config: DesmosConfig
  value: string
  onChange: (v: string) => void
}

const DESMOS_API = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6'

function initCalculator(el: HTMLElement, type: DesmosConfig['calculatorType']): DesmosCalculator | null {
  if (!window.Desmos) return null
  const opts = { keypad: true, expressions: true }
  switch (type) {
    case 'scientific':   return window.Desmos.ScientificCalculator(el, opts)
    case 'fourfunction': return window.Desmos.FourFunctionCalculator(el, opts)
    case 'geometry':     return window.Desmos.Geometry(el, opts)
    default:             return window.Desmos.GraphingCalculator(el, opts)
  }
}

export default function DesmosStudent({ config, value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const calcRef = useRef<DesmosCalculator | null>(null)
  const scriptLoaded = useRef(false)

  function mountCalculator() {
    if (!containerRef.current || !window.Desmos) return
    // Destroy previous instance if any
    calcRef.current?.destroy()
    calcRef.current = null
    containerRef.current.innerHTML = ''

    const calc = initCalculator(containerRef.current, config.calculatorType)
    if (!calc) return
    calcRef.current = calc

    // Load initial expressions
    config.initialExpressions?.forEach((latex, i) => {
      calc.setExpression({ id: `expr${i}`, latex })
    })
  }

  useEffect(() => {
    // If Desmos already loaded from a previous render, mount immediately
    if (window.Desmos) {
      mountCalculator()
    }
    return () => {
      calcRef.current?.destroy()
      calcRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.calculatorType, JSON.stringify(config.initialExpressions)])

  return (
    <div className="space-y-4">
      <Script
        src={DESMOS_API}
        strategy="afterInteractive"
        onLoad={() => {
          scriptLoaded.current = true
          mountCalculator()
        }}
      />

      {/* Calculator container */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: 400 }}
        className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white"
      />

      {/* Response input */}
      {config.responseType === 'observe' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          ✓ Hesap makinesini kullanman yeterli. Cevap girmen gerekmiyor.
        </div>
      )}

      {config.responseType === 'numeric' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cevabınızı girin:
          </label>
          <input
            type="number"
            step="any"
            className="input-field max-w-xs"
            placeholder="Sayısal değer giriniz"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )}

      {config.responseType === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cevabınızı yazın:
          </label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Hesaplama sonucunuzu veya cevabınızı yazınız…"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
