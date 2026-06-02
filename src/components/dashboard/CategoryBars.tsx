import { formatCurrency, getCategoryColor, getCategoryIcon } from '@/lib/categories'
import type { Category } from '@/lib/types'

interface Props {
  expensesByCategory: { category: Category; total: number }[]
  totalExpenses: number
}

export function CategoryBars({ expensesByCategory, totalExpenses }: Props) {
  if (!expensesByCategory.length) return null

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm mb-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Pra onde foi</p>
      <div className="flex flex-col gap-3.5">
        {expensesByCategory.map(({ category, total }) => {
          const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
          const color = getCategoryColor(category.name)
          const icon = getCategoryIcon(category.name)
          return (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span>{icon}</span>
                  <span>{category.name}</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
