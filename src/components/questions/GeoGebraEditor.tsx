'use client'

import { useState } from 'react'

export interface GeoGebraConfig {
  type: 'geogebra'
  materialId?: string
  embedUrl?: string
  appType: 'graphing' | 'geometry' | '3d' | 'classic'
  responseType: 'numeric' | 'text' | 'observe'
  correctAnswer?: string
  tolerance?: number
}

interface Props {
  config?: GeoGebraConfig
  onChange: (config: GeoGebraConfig) => void
}

const APP_TYPES = [
  { value: 'graphing',  label: 'Fonksiyon Grafiği',     desc: 'f(x) grafikleri' },
  { value: 'geometry',  label: 'Geometri Görünümü',      desc: 'Şekil ve ölçüm' },
  { value: '3d',        label: '3D Grafik',              desc: '3 boyutlu görünüm' },
  { value: 'classic',   label: 'Klasik (Koordinat)',     desc: 'Boş koordinat düzlemi' },
] as const

const RESPONSE_TYPES = [
  { value: 'observe',  label: 'Sadece Gözlemle',  desc: 'Cevap kutusu yok, tam puan verilir' },
  { value: 'numeric',  label: 'Sayısal Cevap',    desc: 'Tolerans ile kontrol edilir' },
  { value: 'text',     label: 'Metin Cevap',      desc: 'AI veya anahtar kelime ile değerlendirilir' },
] as const

const TEMPLATES = [
  { label: 'Boş Koordinat Düzlemi', appType: 'classic'  as const, materialId: '' },
  { label: 'Boş Geometri',          appType: 'geometry' as const, materialId: '' },
  { label: 'Fonksiyon Grafiği',     appType: 'graphing' as const, materialId: '' },
  { label: 'Hazır Materyal (ID)',   appType: 'classic'  as const, materialId: '' },
]

function parseMaterialId(input: string): string {
  // Accept full URL like https://www.geogebra.org/m/abc123 or just abc123
  const match = input.match(/geogebra\.org\/m\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  return input.trim()
}

function buildEmbedUrl(materialId: string, appType: string): string {
  if (materialId) {
    return `https://www.geogebra.org/material/iframe/id/${materialId}/width/800/height/500/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/false/rc/false/ld/false/sdz/false/ctl/false`
  }
  const appMap: Record<string, string> = {
    graphing: 'https://www.geogebra.org/graphing?embed',
    geometry: 'https://www.geogebra.org/geometry?embed',
    '3d':     'https://www.geogebra.org/3d?embed',
    classic:  'https://www.geogebra.org/classic?embed',
  }
  return appMap[appType] ?? appMap.classic
}

export default function GeoGebraEditor({ config, onChange }: Props) {
  const cfg: GeoGebraConfig = config ?? {
    type: 'geogebra',
    appType: 'graphing',
    responseType: 'observe',
  }

  const [materialInput, setMaterialInput] = useState(cfg.materialId ?? '')
  const [previewOpen, setPreviewOpen] = useState(false)

  function update(partial: Partial<GeoGebraConfig>) {
    const next = { ...cfg, ...partial }
    if (partial.materialId !== undefined || partial.appType !== undefined) {
      next.embedUrl = buildEmbedUrl(next.materialId ?? '', next.appType)
    }
    onChange(next)
  }

  function applyMaterialInput() {
    const id = parseMaterialId(materialInput)
    setMaterialInput(id)
    update({ materialId: id || undefined, embedUrl: buildEmbedUrl(id, cfg.appType) })
  }

  return (
    <div className="space-y-5">
      {/* App type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          GeoGebra Uygulaması
        </label>
        <div className="grid grid-cols-2 gap-2">
          {APP_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => update({ appType: t.value })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                cfg.appType === t.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-sm text-gray-800">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Material ID */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          GeoGebra Materyal ID / URL (opsiyonel)
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Hazır bir GeoGebra aktivitesi varsa ID veya URL gir. Boş bırakırsan boş uygulama açılır.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1 text-sm font-mono"
            placeholder="abc123 veya https://www.geogebra.org/m/abc123"
            value={materialInput}
            onChange={e => setMaterialInput(e.target.value)}
            onBlur={applyMaterialInput}
          />
          <button
            type="button"
            onClick={applyMaterialInput}
            className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
          >
            Uygula
          </button>
        </div>
        {cfg.materialId && (
          <p className="text-xs text-emerald-600 mt-1">✓ Materyal ID: <span className="font-mono">{cfg.materialId}</span></p>
        )}
      </div>

      {/* Preview */}
      <div>
        <button
          type="button"
          onClick={() => setPreviewOpen(v => !v)}
          className="text-sm text-emerald-600 hover:underline font-medium"
        >
          {previewOpen ? '▲ Önizlemeyi Gizle' : '▼ GeoGebra Önizle'}
        </button>
        {previewOpen && (
          <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
            <iframe
              src={buildEmbedUrl(cfg.materialId ?? '', cfg.appType)}
              width="100%"
              height="400"
              style={{ border: 'none' }}
              title="GeoGebra Preview"
            />
          </div>
        )}
      </div>

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
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="gg-response-type"
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
              placeholder="4.5"
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
              placeholder="0.1"
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
          ℹ️ <strong>Gözlem modu:</strong> Öğrenci sadece GeoGebra'yı inceler, cevap girmez. Otomatik tam puan verilir.
        </div>
      )}
    </div>
  )
}
