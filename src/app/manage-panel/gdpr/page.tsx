'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface GdprLog {
  id: string
  studentName: string
  studentEmail: string
  deletedBy: string
  parentEmailed: boolean
  parentEmail: string | null
  deletedAt: string
}

interface AiLog {
  id: string
  endpoint: string
  tokensUsed: number
  hasPersonalData: boolean
  createdAt: string
}

export default function GdprLogsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'gdpr' | 'ai'>('gdpr')
  const [gdprLogs, setGdprLogs] = useState<GdprLog[]>([])
  const [aiLogs, setAiLogs] = useState<AiLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs(tab)
  }, [tab])

  async function fetchLogs(type: 'gdpr' | 'ai') {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/gdpr/logs?type=${type}`)
      const data = await res.json()
      if (type === 'gdpr') setGdprLogs(data.logs ?? [])
      else setAiLogs(data.logs ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const totalTokens = aiLogs.reduce((sum, l) => sum + l.tokensUsed, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => router.push('/manage-panel')}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Admin
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h1 className="text-lg font-bold text-gray-900">KVKK &amp; Gizlilik Günlükleri</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Uyumluluk Günlükleri</h2>
          <p className="text-sm text-gray-500 mt-1">
            KVKK Madde 7 silme kayıtları ve yapay zeka işlem denetim izi
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('gdpr')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'gdpr'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🛡️ KVKK Silme Günlüğü
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'ai'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🤖 Yapay Zeka Denetim İzi
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'gdpr' ? (
          <GdprTable logs={gdprLogs} />
        ) : (
          <AiTable logs={aiLogs} totalTokens={totalTokens} />
        )}
      </div>
    </div>
  )
}

function GdprTable({ logs }: { logs: GdprLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-3">🛡️</div>
        <p className="font-medium">Henüz silme kaydı yok</p>
        <p className="text-sm mt-1">KVKK kapsamındaki veri silme işlemleri burada görünecek</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Silme Kayıtları</h3>
        <span className="text-sm text-gray-500">{logs.length} kayıt</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">Öğrenci</th>
              <th className="px-6 py-3 text-left">E-posta</th>
              <th className="px-6 py-3 text-left">Silen Yönetici</th>
              <th className="px-6 py-3 text-left">Veli Bildirim</th>
              <th className="px-6 py-3 text-left">Silme Tarihi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{log.studentName}</td>
                <td className="px-6 py-4 text-gray-500">{log.studentEmail}</td>
                <td className="px-6 py-4 text-gray-600">{log.deletedBy}</td>
                <td className="px-6 py-4">
                  {log.parentEmailed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      ✓ Gönderildi{log.parentEmail ? ` — ${log.parentEmail}` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                      — Gönderilmedi
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(log.deletedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AiTable({ logs, totalTokens }: { logs: AiLog[]; totalTokens: number }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-3">🤖</div>
        <p className="font-medium">Henüz yapay zeka kaydı yok</p>
        <p className="text-sm mt-1">AI işlemleri gerçekleştiğinde burada görünecek</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Toplam Çağrı</p>
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Toplam Token</p>
          <p className="text-2xl font-bold text-blue-600">{totalTokens.toLocaleString('tr-TR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Kişisel Veri İçeren</p>
          <p className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.hasPersonalData).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Yapay Zeka İşlem Kaydı</h3>
          <span className="text-sm text-gray-500">{logs.length} kayıt (son 200)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Endpoint</th>
                <th className="px-6 py-3 text-right">Token</th>
                <th className="px-6 py-3 text-center">Kişisel Veri</th>
                <th className="px-6 py-3 text-left">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {log.endpoint}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700">
                    {log.tokensUsed.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {log.hasPersonalData ? (
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">Evet</span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Hayır</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(log.createdAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
