'use client'

export interface DrawingConfig {
  type: 'drawing'
  backgroundImage?: string
  canvasWidth: number
  canvasHeight: number
  allowColors: boolean
  allowBrushSize: boolean
  gradingType: 'manual' | 'ai'
  rubric?: string
}

interface Props {
  config?: DrawingConfig
  onChange: (cfg: DrawingConfig) => void
}

const defaults: DrawingConfig = {
  type: 'drawing',
  canvasWidth: 800,
  canvasHeight: 500,
  allowColors: true,
  allowBrushSize: true,
  gradingType: 'manual',
}

export default function DrawingEditor({ config, onChange }: Props) {
  const cfg = config ?? defaults
  const u = (p: Partial<DrawingConfig>) => onChange({ ...cfg, ...p })

  return (
    <div className="space-y-5">
      {/* Background image */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Arka Plan Görseli (opsiyonel)
        </label>
        <input
          type="text"
          className="input-field text-sm"
          placeholder="https://... (görsel URL'si)"
          value={cfg.backgroundImage ?? ''}
          onChange={e => u({ backgroundImage: e.target.value || undefined })}
        />
        {cfg.backgroundImage && (
          <img src={cfg.backgroundImage} alt="bg preview" className="mt-2 max-h-32 rounded border border-gray-200 object-contain" />
        )}
      </div>

      {/* Canvas size */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Genişlik (px)</label>
          <input type="number" min="300" max="1200" className="input-field text-sm"
            value={cfg.canvasWidth} onChange={e => u({ canvasWidth: parseInt(e.target.value) || 800 })} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Yükseklik (px)</label>
          <input type="number" min="200" max="800" className="input-field text-sm"
            value={cfg.canvasHeight} onChange={e => u({ canvasHeight: parseInt(e.target.value) || 500 })} />
        </div>
      </div>

      {/* Toolbar options */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={cfg.allowColors} onChange={e => u({ allowColors: e.target.checked })} className="rounded" />
          <span className="text-sm text-gray-700">Renk paleti göster</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={cfg.allowBrushSize} onChange={e => u({ allowBrushSize: e.target.checked })} className="rounded" />
          <span className="text-sm text-gray-700">Fırça boyutu göster</span>
        </label>
      </div>

      {/* Grading type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Değerlendirme Yöntemi</label>
        <div className="space-y-2">
          {([
            { v: 'manual', label: 'Manuel', desc: 'Öğretmen çizimi görür ve puanlar' },
            { v: 'ai',     label: 'AI ile Değerlendir', desc: 'Çizim AI\'ya gönderilir, rubric ile puanlanır' },
          ] as const).map(r => (
            <label key={r.v} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${cfg.gradingType === r.v ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="drawing-grading" checked={cfg.gradingType === r.v} onChange={() => u({ gradingType: r.v })} className="mt-0.5" />
              <div>
                <div className="font-medium text-sm text-gray-800">{r.label}</div>
                <div className="text-xs text-gray-500">{r.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {cfg.gradingType === 'ai' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Rubric / Beklenti</label>
          <textarea rows={3} className="input-field text-sm resize-y"
            placeholder="Örn: Hücrenin tüm organellerini (mitokondri, çekirdek, ribozom) doğru şekilde çizin ve etiketleyin."
            value={cfg.rubric ?? ''}
            onChange={e => u({ rubric: e.target.value })} />
        </div>
      )}

      {cfg.gradingType === 'manual' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          ℹ️ Manuel değerlendirme: Öğrenci çizimi base64 PNG olarak kaydedilir. Öğretmen test sonuçlarından görebilir.
        </div>
      )}
    </div>
  )
}
