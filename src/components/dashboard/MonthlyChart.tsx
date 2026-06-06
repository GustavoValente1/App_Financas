'use client'

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getMonthLabel, formatCurrency } from '@/lib/categories'

interface MonthData {
  month: string
  expenses: number
  income: number
}

interface Props {
  data: MonthData[]
  currentMonth: string
}

export function MonthlyChart({ data, currentMonth }: Props) {
  if (!data.length) return null

  const chartData = data.map(d => ({
    label: getMonthLabel(d.month),
    despesas: d.expenses,
    receitas: d.income,
    month: d.month,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-foreground text-background text-xs px-3 py-2 rounded-lg shadow-md space-y-1">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey}>
            {p.dataKey === 'receitas' ? 'Receitas' : 'Despesas'}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm mb-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Evolução mensal</p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={chartData} barCategoryGap="25%" barGap={2}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
          />
          <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
          <Bar dataKey="receitas" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey="despesas" radius={[3, 3, 0, 0]} maxBarSize={18}
            fill="#c4b5fd"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-400" />
          Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-300" />
          Despesas
        </span>
      </div>
    </div>
  )
}
