'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useIncomeSources } from '@/hooks/useCategories'
import { useYearTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/categories'
import { cn } from '@/lib/utils'

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtCell(num: number): string {
  if (num === 0) return '–'
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function EntradasPage() {
  const currentYear = new Date().getFullYear()
  const currentMonthIdx = new Date().getMonth()
  const [year, setYear] = useState(currentYear)

  const { data: incomeSources = [] } = useIncomeSources()
  const { data: transactions = [], isLoading } = useYearTransactions(year, 'competencia')

  const tracked = useMemo(
    () => incomeSources.filter(s => s.monthly_goal !== null && s.monthly_goal > 0),
    [incomeSources]
  )

  // Months in the future have no contribution to compare against yet
  const lastRelevantMonth = year < currentYear ? 11 : year > currentYear ? -1 : currentMonthIdx

  const rows = useMemo(() => tracked.map(source => {
    const paid = Array(12).fill(0)
    for (const tx of transactions) {
      if (tx.type !== 'income' || tx.income_source_id !== source.id) continue
      const mIdx = parseInt(tx.competencia.split('-')[1]) - 1
      if (mIdx >= 0 && mIdx <= 11) paid[mIdx] += tx.amount
    }
    const goal = source.monthly_goal ?? 0
    let diffTotal = 0
    for (let i = 0; i <= lastRelevantMonth; i++) diffTotal += paid[i] - goal
    return { source, paid, goal, diffTotal }
  }), [tracked, transactions, lastRelevantMonth])

  return (
    <div>
      <h1 className="text-xl font-semibold mb-5">Entradas</h1>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setYear(y => y - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-card shadow-sm hover:bg-muted transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold text-base w-12 text-center">{year}</span>
        <button
          onClick={() => setYear(y => y + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-card shadow-sm hover:bg-muted transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {tracked.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">
          Nenhuma origem de receita com meta mensal cadastrada. Defina uma meta em Cadastros → Receitas.
        </p>
      ) : isLoading ? (
        <div className="h-48 bg-card rounded-2xl animate-pulse" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-card shadow-sm mb-4">
            <table className="min-w-[860px] w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2.5 font-semibold min-w-[160px]">Origem (meta mensal)</th>
                  {MONTH_LABELS.map((m, i) => (
                    <th
                      key={m}
                      className={cn('text-right px-2 py-2.5 font-semibold min-w-[68px]', i > lastRelevantMonth && 'text-muted-foreground/50')}
                    >
                      {m}
                    </th>
                  ))}
                  <th className="text-right px-3 py-2.5 font-semibold min-w-[120px]">Saldo no ano</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ source, paid, goal, diffTotal }) => (
                  <tr key={source.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <div className="font-medium">{source.name}</div>
                      <div className="text-muted-foreground">{formatCurrency(goal)}/mês</div>
                    </td>
                    {paid.map((amt, i) => {
                      const future = i > lastRelevantMonth
                      const ok = amt >= goal
                      return (
                        <td
                          key={i}
                          className={cn(
                            'text-right px-2 py-2',
                            future
                              ? 'text-muted-foreground/50'
                              : ok
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : amt > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400 font-medium'
                          )}
                        >
                          {future ? '–' : fmtCell(amt)}
                        </td>
                      )
                    })}
                    <td className={cn(
                      'text-right px-3 py-2 font-bold',
                      diffTotal < 0 ? 'text-red-600 dark:text-red-400' : diffTotal > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
                    )}>
                      {diffTotal === 0 ? '–' : `${diffTotal > 0 ? '+' : '-'}${formatCurrency(Math.abs(diffTotal))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2">
            {rows.map(({ source, diffTotal }) => (
              <div key={source.id} className="bg-card rounded-2xl px-4 py-3.5 shadow-sm flex items-center justify-between">
                <span className="text-sm font-medium">{source.name}</span>
                <span className={cn(
                  'text-sm font-semibold',
                  diffTotal < 0 ? 'text-red-600 dark:text-red-400' : diffTotal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                )}>
                  {diffTotal < 0
                    ? `Em aberto: ${formatCurrency(Math.abs(diffTotal))}`
                    : diffTotal > 0
                    ? `Excedido: ${formatCurrency(diffTotal)}`
                    : 'Em dia'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
