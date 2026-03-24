'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'

interface Component {
  name: string
  avg: number | null
  count: number
}

interface Props {
  data: Component[]
  loading?: boolean
  referenceValue?: number
}

function barColor(avg: number | null) {
  if (avg === null) return '#d1d5db'
  if (avg >= 85) return '#22c55e'
  if (avg >= 70) return '#f59e0b'
  return '#ef4444'
}

export default function ComponentBar({ data, loading, referenceValue }: Props) {
  if (loading) return <div className="h-56 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  const filtered = data.filter(d => d.avg !== null)
  if (filtered.length === 0) return <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Veri yok</div>

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={filtered} margin={{ bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: unknown, _: unknown, p: { payload?: { count?: number } }) => [`${v} (${p?.payload?.count ?? 0} öğrenci)`, 'Ortalama']}
        />
        {referenceValue !== undefined && <ReferenceLine y={referenceValue} stroke="#6366f1" strokeDasharray="4 4" label={{ value: `Sınıf: ${referenceValue}`, fontSize: 10 }} />}
        <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
          {filtered.map((d, i) => <Cell key={i} fill={barColor(d.avg)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
