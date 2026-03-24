'use client'

interface RiskStudent {
  student: string
  class: string
  avg: number | null
  attendanceRate: number
  riskFactors: string[]
}

const RISK_BADGE: Record<string, { label: string; color: string }> = {
  LOW_GRADE:    { label: '🔴 Düşük Not',     color: 'bg-red-100 text-red-700'    },
  HIGH_ABSENCE: { label: '🟡 Yüksek Devamsızlık', color: 'bg-amber-100 text-amber-700' },
  TREND_DOWN:   { label: '🟠 Düşüş Trendi', color: 'bg-orange-100 text-orange-700' },
}

interface Props {
  data: RiskStudent[]
  loading?: boolean
}

export default function RiskTable({ data, loading }: Props) {
  if (loading) return <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  if (data.length === 0) return (
    <div className="text-center py-8">
      <div className="text-3xl mb-2">✅</div>
      <p className="text-sm text-gray-400">Risk altında öğrenci yok</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Öğrenci</th>
            <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Sınıf</th>
            <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Ortalama</th>
            <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Devam %</th>
            <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Risk</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="px-4 py-2.5 font-medium text-gray-900">{s.student}</td>
              <td className="px-4 py-2.5 text-gray-500">{s.class}</td>
              <td className={`px-4 py-2.5 text-right font-bold ${s.avg !== null && s.avg < 60 ? 'text-red-600' : 'text-gray-700'}`}>
                {s.avg ?? '—'}
              </td>
              <td className={`px-4 py-2.5 text-right font-bold ${s.attendanceRate < 80 ? 'text-amber-600' : 'text-gray-700'}`}>
                %{s.attendanceRate}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex gap-1.5 flex-wrap">
                  {s.riskFactors.map(f => {
                    const badge = RISK_BADGE[f]
                    return badge ? (
                      <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                    ) : null
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
