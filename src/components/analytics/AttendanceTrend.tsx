'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrendPoint {
  month: string
  absent: number
  late: number
  excused?: number
  present?: number
}

interface Props {
  data: TrendPoint[]
  loading?: boolean
  showPresent?: boolean
}

export default function AttendanceTrend({ data, loading, showPresent }: Props) {
  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Veri yok</div>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend formatter={(v: string) => ({ absent: 'Absent', late: 'Late', excused: 'Excused', present: 'Present' }[v] ?? v)} />
        <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="absent" />
        <Line type="monotone" dataKey="late"   stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="late" />
        {data[0]?.excused !== undefined && <Line type="monotone" dataKey="excused" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="excused" />}
        {showPresent && <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="present" />}
      </LineChart>
    </ResponsiveContainer>
  )
}
