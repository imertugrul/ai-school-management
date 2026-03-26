'use client'

import { useState } from 'react'

export interface DesmosConfig {
  type: 'desmos'
  calculatorType: 'graphing' | 'scientific' | 'fourfunction' | 'geometry'
  initialExpressions: string[]
  responseType: 'numeric' | 'text' | 'observe'
  correctAnswer?: string
  tolerance?: number
}

interface Props {
  config?: DesmosConfig
  onChange: (config: DesmosConfig) => void
}

const CALC_TYPES = [
  { value: 'graphing',     label: 'Grafik Hesaplayıcı',      desc: 'Fonksiyon grafikleri, denklemler' },
  { value: 'scientific',   label: 'Bilimsel Hesap Makinesi', desc: 'Trigonometri, logaritma vb.' },
  { value: 'fourfunction', label: '4 İşlem Hesaplayıcı',     desc: 'Temel aritmetik işlemler' },
  { value: 'geometry',     label: 'Geometri',                desc: 'Geometrik şekil ve ölçüm' },
] as const

const RESPONSE_TYPES = [
  { value: 'observe',  label: 'Hesaplama Yap / Gözlemle', desc: 'Cevap kutusu yok, tam puan verilir' },
  { value: 'numeric',  label: 'Sayısal Cevap',            desc: 'Tolerans ile kontrol edilir' },
  { value: 'text',     label: 'Metin / İfade Cevabı',     desc: 'AI veya anahtar kelime ile değerlendirilir' },
] as const

const uid = () => Math.random().toString(36).slice(2, 8)

export default function DesmosEditor({ config, onChange }: Props) {
  const cfg: DesmosConfig = config ?? {
    type: 'desmos',
    calculatorType: 'graphing',
    initialExpressions: [],
    responseType: 'observe',
  }

  const [newExpr, setNewExpr] = useState('')

  function update(partial: Partial<DesmosConfig>) {
    onChange({ ...cfg, ...partial })
  }

  function addExpression() {
    const expr = newExpr.trim()
    if (!expr) return
    update({ initialExpressions: [...(cfg.initialExpressions ?? []), expr] })
    setNewExpr('')
  }

  function removeExpression(idx: number) {
    update({ initialExpressions: cfg.initialExpressions.filter((_, i) => i !== idx) })
  }

  function updateExpression(idx: number, val: string) {
    const exprs = [...cfg.initialExpressions]
    exprs[idx] = val
    update({ initialExpressions: exprs })
  }

  return (
    <div className="space-y-5">
      {/* Calculator type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Desmos Hesaplayıcı Türü
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CALC_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => update({ calculatorType: t.value })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                cfg.calculatorType === t.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-sm text-gray-800">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Initial expressions (only for graphing/geometry) */}
      {(cfg.calculatorType === 'graphing' || cfg.calculatorType === 'geometry') && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Başlangıç İfadeleri (opsiyonel)
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Öğrenci grafiği açtığında önceden yüklenecek denklemler. Örn: <code className="bg-gray-100 px-1 rounded">y=2x+1</code>
          </p>

          {cfg.initialExpressions.length > 0 && (
            <div className="space-y-2 mb-3">
              {cfg.initialExpressions.map((expr, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1 text-sm font-mono"
                    value={expr}
                    onChange={e => updateExpression(i, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeExpression(i)}
                    className="px-2 py-1 text-red-500 hover:text-red-700 text-lg leading-none"
                    title="Sil"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1 text-sm font-mono"
              placeholder="y=2x+1 veya x^2+y^2=25"
              value={newExpr}
              onChange={e => setNewExpr(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExpression())}
            />
            <button
              type="button"
              onClick={addExpression}
              className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              + Ekle
            </button>
          </div>
        </div>
      )}

      {/* Response type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Öğrenciden Beklenen
        </label>
        <div className="space-y-2">
          {RESPONSE_TYPES.map(r => (
            <label
              key={r.value}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                cfg.responseType === r.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="desmos-response-type"
                checked={cfg.responseType === r.value}
                onChange={() => update({ responseType: r.value })}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-sm text-gray-800">{r.label}</div>
                <div className="text-xs text-gray-500">{r.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Correct answer */}
      {cfg.responseType === 'numeric' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Doğru Cevap (Sayı)
            </label>
            <input
              type="number"
              step="any"
              className="input-field text-sm"
              placeholder="3"
              value={cfg.correctAnswer ?? ''}
              onChange={e => update({ correctAnswer: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Tolerans (±)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              className="input-field text-sm"
              placeholder="0.01"
              value={cfg.tolerance ?? 0.01}
              onChange={e => update({ tolerance: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      )}

      {cfg.responseType === 'text' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Doğru Cevap / Anahtar Kelimeler
          </label>
          <input
            type="text"
            className="input-field text-sm"
            placeholder="Beklenen cevap veya anahtar kelimeler (virgülle ayır)"
            value={cfg.correctAnswer ?? ''}
            onChange={e => update({ correctAnswer: e.target.value })}
          />
        </div>
      )}

      {cfg.responseType === 'observe' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          ℹ️ <strong>Hesaplama / Gözlem modu:</strong> Öğrenci Desmos'u serbestçe kullanır. Otomatik tam puan verilir.
        </div>
      )}
    </div>
  )
}
