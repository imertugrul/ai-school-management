'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

interface AppointmentCard {
  studentName: string
  subject: string
  preferredTime?: string
  message: string
}

const QUICK_QUESTIONS = [
  { label: '📊 Notlar',       text: 'Çocuğumun son not durumu nedir?' },
  { label: '📅 Devamsızlık',  text: 'Çocuğumun devamsızlık bilgisini verir misin?' },
  { label: '📋 Dersler',      text: 'Hangi derslere kayıtlı?' },
  { label: '🗓 Randevu',      text: 'Öğretmenle görüşmek için randevu almak istiyorum.' },
  { label: '📄 Belgeler',     text: 'Okul belgeleri ve yönetmelikler hakkında bilgi verir misin?' },
  { label: '👨‍🏫 Öğretmen',    text: 'Sınıf öğretmeni kimdir?' },
]

function parseAppointment(content: string): { clean: string; appt: AppointmentCard | null } {
  const match = content.match(/\|\|\|APPOINTMENT_REQUEST\|\|\|(.+?)\|\|\|/)
  if (!match) return { clean: content, appt: null }
  try {
    const appt: AppointmentCard = JSON.parse(match[1])
    const clean = content.replace(/\|\|\|APPOINTMENT_REQUEST\|\|\|.+?\|\|\|/, '').trim()
    return { clean, appt }
  } catch {
    return { clean: content, appt: null }
  }
}

export default function ParentChatPage() {
  const { data: session } = useSession()
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Load chat history
  useEffect(() => {
    fetch('/api/parent/chat/history')
      .then(r => r.json())
      .then((data: Message[]) => {
        if (Array.isArray(data)) setMessages(data)
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || streaming) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setStreaming(true)

    const aiMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, aiMsg])

    try {
      const res = await fetch('/api/parent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Hata' }))
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: `Hata: ${err.error}` }
          return copy
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: full }
          return copy
        })
      }
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Veli'

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 mb-3 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
          <div>
            <p className="font-bold text-base">SchoolPro AI Asistan</p>
            <p className="text-blue-100 text-xs">Merhaba {firstName}, size nasıl yardımcı olabilirim?</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-green-400/30 text-green-100 px-2 py-1 rounded-full">Çevrimiçi</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            <p className="text-4xl mb-3">💬</p>
            <p>Aşağıdaki hızlı sorulardan birini seçin veya mesajınızı yazın.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
                  {msg.content}
                </div>
              </div>
            )
          }

          const { clean, appt } = parseAppointment(msg.content)
          return (
            <div key={i} className="flex justify-start gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-base shrink-0 mt-1">🤖</div>
              <div className="max-w-[85%] space-y-2">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 shadow-sm whitespace-pre-wrap">
                  {clean || (streaming && i === messages.length - 1 ? <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse rounded" /> : '')}
                </div>
                {appt && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm shadow-sm">
                    <p className="font-semibold text-amber-800 mb-1.5">📅 Randevu Talebi Oluşturuldu</p>
                    <p className="text-amber-700"><span className="font-medium">Öğrenci:</span> {appt.studentName}</p>
                    <p className="text-amber-700"><span className="font-medium">Konu:</span> {appt.subject}</p>
                    {appt.preferredTime && (
                      <p className="text-amber-700"><span className="font-medium">Tercih:</span> {appt.preferredTime}</p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-amber-500 text-xs">⏳</span>
                      <span className="text-xs text-amber-600 font-medium">Onay bekleniyor</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {streaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-base shrink-0">🤖</div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q.label}
            onClick={() => sendMessage(q.text)}
            disabled={streaming}
            className="shrink-0 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-1">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesajınızı yazın..."
          disabled={streaming}
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          style={{ maxHeight: '120px' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming}
          className="shrink-0 w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white rounded-2xl flex items-center justify-center transition-colors shadow-sm"
        >
          {streaming
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          }
        </button>
      </div>
    </div>
  )
}
