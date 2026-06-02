'use client'

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getMonthLabel, formatCurrency } from '@/lib/categories'

interface MonthData {
  month: string
  expenses: number
}

interface Props {
  data: MonthData[]
  currentMonth: string
}

export function MonthlyChart({ data, currentMonth }: Props) {
  if (!data.length) return null

  const min = Math.min(...data.map(d => d.expenses))
  const max = Math.max(...data.map(d => d.expenses))
  const minMonth = data.find(d => d.expenses === min)?.month
  const maxMonth = data.find(d => d.expenses === max)?.month

  const chartData = data.map(d => ({
    label: getMonthLabel(d.month),
    value: d.expenses,
    month: d.month,
  }))

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm mb-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Evolução mensal</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} barCategoryGap="30%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-foreground text-background text-xs px-2 py-1 rounded-lg shadow-md">
                  {formatCurrency(payload[0].value as number)}
                </div>
              )
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map(d => (
              <Cell
                key={d.month}
                fill={d.month === currentMonth ? '#4c1d95' : '#c4b5fd'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {(minMonth || maxMonth) && (
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>menor: {formatCurrency(min)} ({getMonthLabel(minMonth ?? '')})</span>
          <span>maior: {formatCurrency(max)} ({getMonthLabel(maxMonth ?? '')})</span>
        </div>
      )}
    </div>
  )
}
