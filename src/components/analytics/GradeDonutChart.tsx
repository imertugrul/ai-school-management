'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props {
  data: { A: number; B: number; C: number; D: number; F: number } | null
  loading?: boolean
}

const COLORS  = ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444']
const LABELS  = ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (0-59)']
const KEYS    = ['A', 'B', 'C', 'D', 'F'] as const

export default function GradeDonutChart({ data, loading }: Props) {
  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!data) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Veri yok</div>

  const chartData = KEYS.map((k, i) => ({ name: LABELS[i], value: data[k], color: COLORS[i] })).filter(d => d.value > 0)
  const total     = chartData.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Veri yok</div>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
          {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip formatter={(value: unknown) => { const v = Number(value); return [`${v} öğrenci (%${Math.round(v / total * 100)})`, ''] }} />
        <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}
