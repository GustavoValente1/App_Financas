import { formatCurrency } from '@/lib/categories'
import type { Transaction } from '@/lib/types'

interface Props {
  transactions: Transaction[]
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export function TopExpenses({ transactions }: Props) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (!sorted.length) return null

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm mb-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
        Lançamentos do mês
      </p>
      <div className="flex flex-col divide-y divide-border">
        {sorted.map(tx => (
          <div key={tx.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-muted-foreground shrink-0 w-9">
                {formatDate(tx.date)}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">
                  {tx.description || tx.subcategory?.name || tx.income_source?.name || '—'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {tx.type === 'expense'
                    ? [tx.subcategory?.category?.name, tx.subcategory?.name, tx.payment_source?.name]
                        .filter(Boolean).join(' · ')
                    : [tx.income_source?.name, tx.payment_source?.name]
                        .filter(Boolean).join(' → ')}
                </p>
              </div>
            </div>
            <span className={`text-sm font-medium shrink-0 ml-3 ${tx.type === 'income' ? 'text-emerald-600' : 'text-foreground'}`}>
              {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
