'use client'

import { useRef, useState, useEffect } from 'react'
import { AudioResponseConfig } from './AudioResponseEditor'

interface Props {
  config: AudioResponseConfig
  value: string
  onChange: (v: string) => void
}

type RecordState = 'idle' | 'recording' | 'done' | 'unsupported'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function AudioResponseStudent({ config, value, onChange }: Props) {
  const [state, setState] = useState<RecordState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRef   = useRef<MediaRecorder | null>(null)
  const chunksRef  = useRef<Blob[]>([])
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) setState('unsupported')
  }, [])

  // Cleanup on unmount
  useEffect(() => () => {
    timerRef.current && clearInterval(timerRef.current)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url  = URL.createObjectURL(blob)
        setAudioUrl(url)
        setState('done')
        // Convert to base64 for storage
        const reader = new FileReader()
        reader.onload = () => onChange(reader.result as string)
        reader.readAsDataURL(blob)
      }
      mr.start()
      mediaRef.current = mr
      setState('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(s => {
          if (s + 1 >= config.maxDuration) {
            stopRecording()
            return s + 1
          }
          return s + 1
        })
      }, 1000)
    } catch {
      setState('unsupported')
    }
  }

  function stopRecording() {
    timerRef.current && clearInterval(timerRef.current)
    timerRef.current = null
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.stop()
    }
  }

  function deleteRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setElapsed(0)
    setState('idle')
    onChange('')
  }

  const pct = Math.min((elapsed / config.maxDuration) * 100, 100)

  if (state === 'unsupported') {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        ⚠️ Tarayıcınız ses kaydını desteklemiyor. Lütfen <strong>Chrome</strong> veya <strong>Firefox</strong> kullanın.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {config.instructions && (
        <p className="text-sm text-gray-600 bg-pink-50 border border-pink-200 rounded-lg p-3">{config.instructions}</p>
      )}

      <div className="rounded-xl border-2 border-gray-200 p-5 space-y-4 bg-gray-50">
        {/* Idle */}
        {state === 'idle' && (
          <div className="text-center space-y-3">
            <div className="text-4xl">🎤</div>
            <p className="text-sm text-gray-600">Cevabınızı kaydedin</p>
            <p className="text-xs text-gray-400">Maks: {formatTime(config.maxDuration)}</p>
            <button type="button" onClick={startRecording}
              className="px-6 py-3 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 transition-colors shadow-sm">
              ● Kaydı Başlat
            </button>
          </div>
        )}

        {/* Recording */}
        {state === 'recording' && (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-800">Kaydediliyor... {formatTime(elapsed)}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400">{formatTime(config.maxDuration)}</p>
            <button type="button" onClick={stopRecording}
              className="px-6 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-800 transition-colors">
              ■ Durdur
            </button>
          </div>
        )}

        {/* Done */}
        {state === 'done' && audioUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 text-lg">✅</span>
              <span className="text-sm font-semibold text-gray-800">Kayıt tamamlandı ({formatTime(elapsed)})</span>
            </div>
            <audio controls src={audioUrl} className="w-full" />
            <div className="flex gap-2">
              <button type="button" onClick={deleteRecording}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                🗑️ Sil
              </button>
              <button type="button" onClick={startRecording}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-pink-200 text-pink-600 text-sm font-medium hover:bg-pink-50 transition-colors">
                🔄 Yeniden Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
