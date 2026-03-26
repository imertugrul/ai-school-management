'use client'

import { GeoGebraConfig } from './GeoGebraEditor'

interface Props {
  config: GeoGebraConfig
  value: string
  onChange: (v: string) => void
}

function buildEmbedUrl(materialId: string | undefined, appType: string): string {
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

export default function GeoGebraStudent({ config, value, onChange }: Props) {
  const embedUrl = config.embedUrl || buildEmbedUrl(config.materialId, config.appType)

  return (
    <div className="space-y-4">
      {/* GeoGebra iframe */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <iframe
          src={embedUrl}
          width="100%"
          height="500"
          style={{ border: 'none', display: 'block' }}
          title="GeoGebra"
          allowFullScreen
        />
      </div>

      {/* Response input based on type */}
      {config.responseType === 'observe' && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
          ✓ Bu soruyu incelemen yeterli. Cevap girmen gerekmiyor.
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
            placeholder="Gözleminizi veya cevabınızı yazınız…"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
