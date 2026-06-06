'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { getCategoryColor, formatCurrency } from '@/lib/categories'
import type { Category } from '@/lib/types'

interface Props {
  expensesByCategory: { category: Category; total: number }[]
  totalExpenses: number
  monthLabel: string
}

export function CompositionChart({ expensesByCategory, totalExpenses, monthLabel }: Props) {
  if (!expensesByCategory.length) return null

  const data = expensesByCategory.map(({ category, total }) => ({
    name: category.name,
    value: total,
    color: getCategoryColor(category.name),
  }))

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm mb-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
        Composição de {monthLabel}
      </p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--background)"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const pct = totalExpenses > 0 ? ((payload[0].value as number) / totalExpenses) * 100 : 0
                return (
                  <div className="bg-foreground text-background text-xs px-2 py-1 rounded-lg">
                    {pct.toFixed(0)}%
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5 flex-1">
          {data.map(d => {
            const pct = totalExpenses > 0 ? (d.value / totalExpenses) * 100 : 0
            return (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-foreground">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{formatCurrency(d.value)}</span>
                  <span className="text-muted-foreground font-medium w-7 text-right">{pct.toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
