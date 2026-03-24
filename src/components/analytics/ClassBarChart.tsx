'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { class: string; avg: number | null }[]
  loading?: boolean
  horizontal?: boolean
  referenceValue?: number
}

function barColor(avg: number | null) {
  if (avg === null) return '#d1d5db'
  if (avg >= 85) return '#22c55e'
  if (avg >= 70) return '#f59e0b'
  return '#ef4444'
}

export default function ClassBarChart({ data, loading, horizontal, referenceValue }: Props) {
  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  const filtered = data.filter(d => d.avg !== null)
  if (filtered.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Veri yok</div>

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(filtered.length * 36 + 40, 160)}>
        <BarChart data={filtered} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="class" tick={{ fontSize: 11 }} width={60} />
          <Tooltip formatter={(v: unknown) => [`${v}`, 'Ortalama']} />
          {referenceValue !== undefined && <ReferenceLine x={referenceValue} stroke="#6366f1" strokeDasharray="4 4" label={{ value: `Ort: ${referenceValue}`, position: 'top', fontSize: 10 }} />}
          <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
            {filtered.map((d, i) => <Cell key={i} fill={barColor(d.avg)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={filtered} margin={{ bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="class" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: unknown) => [`${v}`, 'Ortalama']} />
        {referenceValue !== undefined && <ReferenceLine y={referenceValue} stroke="#6366f1" strokeDasharray="4 4" />}
        <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
          {filtered.map((d, i) => <Cell key={i} fill={barColor(d.avg)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
