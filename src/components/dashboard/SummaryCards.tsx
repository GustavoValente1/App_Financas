import { formatCurrency } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface Props {
  totalIncome: number
  balance: number
  prevMonthIncome: number
  prevMonthBalance: number
}

export function SummaryCards({ totalIncome, balance, prevMonthIncome, prevMonthBalance }: Props) {
  const incPct = prevMonthIncome > 0 ? ((totalIncome - prevMonthIncome) / prevMonthIncome) * 100 : null
  const balPct = prevMonthBalance !== 0 ? ((balance - prevMonthBalance) / Math.abs(prevMonthBalance)) * 100 : null

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <div className="bg-card rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-muted-foreground mb-1">Receita</p>
        <p className={cn('text-lg font-medium', totalIncome > 0 ? 'text-green-600' : 'text-foreground')}>
          {formatCurrency(totalIncome)}
        </p>
        {incPct !== null && (
          <p className={cn('text-xs mt-0.5', incPct >= 0 ? 'text-green-500' : 'text-red-500')}>
            {incPct >= 0 ? '+' : ''}{incPct.toFixed(0)}%
          </p>
        )}
      </div>
      <div className="bg-card rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-muted-foreground mb-1">Saldo</p>
        <p className={cn('text-lg font-medium', balance >= 0 ? 'text-green-600' : 'text-red-500')}>
          {balance < 0 ? '− ' : ''}{formatCurrency(Math.abs(balance))}
        </p>
        {balPct !== null && (
          <p className={cn('text-xs mt-0.5', balPct >= 0 ? 'text-green-500' : 'text-red-500')}>
            {balPct >= 0 ? '+' : ''}{balPct.toFixed(0)}%
          </p>
        )}
      </div>
    </div>
  )
}
