import { formatCurrency } from '@/lib/categories'
import type { Transaction } from '@/lib/types'

interface Props {
  transactions: Transaction[]
}

export function TopExpenses({ transactions }: Props) {
  const top = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  if (!top.length) return null

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm mb-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Maiores gastos do mês</p>
      <div className="flex flex-col">
        {top.map((tx, i) => (
          <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
              <div>
                <p className="text-sm text-foreground">
                  {tx.description || tx.subcategory?.name || '—'}
                </p>
                {tx.subcategory && (
                  <p className="text-xs text-muted-foreground">
                    {tx.subcategory.category?.name} · {tx.subcategory.name}
                  </p>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-foreground">{formatCurrency(tx.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
