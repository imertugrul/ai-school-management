'use client'

export interface AudioResponseConfig {
  type: 'audio_response'
  maxDuration: number
  instructions?: string
  gradingType: 'manual' | 'ai'
  rubric?: string
}

interface Props {
  config?: AudioResponseConfig
  onChange: (cfg: AudioResponseConfig) => void
}

const defaults: AudioResponseConfig = {
  type: 'audio_response',
  maxDuration: 60,
  gradingType: 'manual',
}

const DURATIONS = [
  { value: 30,  label: '30 saniye' },
  { value: 60,  label: '1 dakika' },
  { value: 120, label: '2 dakika' },
  { value: 300, label: '5 dakika' },
]

export default function AudioResponseEditor({ config, onChange }: Props) {
  const cfg = config ?? defaults
  const u = (p: Partial<AudioResponseConfig>) => onChange({ ...cfg, ...p })

  return (
    <div className="space-y-5">
      {/* Duration */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Maksimum Kayıt Süresi</label>
        <div className="flex gap-2 flex-wrap">
          {DURATIONS.map(d => (
            <button key={d.value} type="button" onClick={() => u({ maxDuration: d.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${cfg.maxDuration === d.value ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Öğrenci Yönlendirmesi (opsiyonel)</label>
        <input type="text" className="input-field text-sm"
          placeholder="Örn: Fotosentezi kısaca sesli olarak açıklayın."
          value={cfg.instructions ?? ''}
          onChange={e => u({ instructions: e.target.value || undefined })} />
      </div>

      {/* Grading type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Değerlendirme Yöntemi</label>
        <div className="space-y-2">
          {([
            { v: 'manual', label: 'Manuel', desc: 'Öğretmen sesi dinler ve puanlar' },
            { v: 'ai',     label: 'AI ile Değerlendir', desc: 'Ses transkripte çevrilir, AI rubric ile değerlendirir' },
          ] as const).map(r => (
            <label key={r.v} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${cfg.gradingType === r.v ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="audio-grading" checked={cfg.gradingType === r.v} onChange={() => u({ gradingType: r.v })} className="mt-0.5" />
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Rubric / Beklentiler</label>
          <textarea rows={3} className="input-field text-sm resize-y"
            placeholder="Örn: Cevap ışık, CO2, H2O ve glikoz kavramlarına değinmeli. Fotosentez denklemi açıklanmalı."
            value={cfg.rubric ?? ''}
            onChange={e => u({ rubric: e.target.value })} />
        </div>
      )}

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 text-xs text-pink-700">
        🎤 Ses kaydı <strong>MediaRecorder API</strong> kullanır. Chrome, Firefox, Edge destekler. Safari desteği sınırlıdır.
      </div>
    </div>
  )
}
