import { formatCurrency } from '@/lib/categories'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  totalExpenses: number
  prevMonthExpenses?: number
  label?: string
}

export function HeroCard({ totalExpenses, prevMonthExpenses, label = 'Gasto no mês' }: Props) {
  const hasComparison = prevMonthExpenses !== undefined && prevMonthExpenses > 0
  const pct = hasComparison ? ((totalExpenses - prevMonthExpenses!) / prevMonthExpenses!) * 100 : 0
  const isUp = pct > 0
  const isDown = pct < 0

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm mb-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-4xl font-semibold text-foreground leading-none mb-2">
        {formatCurrency(totalExpenses)}
      </p>
      {hasComparison && (
        <div className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
          isUp ? 'bg-red-50 text-red-600' : isDown ? 'bg-green-50 text-green-600' : 'bg-muted text-muted-foreground'
        )}>
          {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
          {isUp ? '+' : ''}{pct.toFixed(0)}% vs mês anterior
        </div>
      )}
    </div>
  )
}
