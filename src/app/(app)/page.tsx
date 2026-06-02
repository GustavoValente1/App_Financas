'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { HeroCard } from '@/components/dashboard/HeroCard'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CategoryBars } from '@/components/dashboard/CategoryBars'
import { MonthlyChart } from '@/components/dashboard/MonthlyChart'
import { CompositionChart } from '@/components/dashboard/CompositionChart'
import { TopExpenses } from '@/components/dashboard/TopExpenses'
import { NewTransactionSheet } from '@/components/transaction/NewTransactionSheet'
import { useDashboardTransactions, useMonthlyEvolution } from '@/hooks/useTransactions'
import { toCompetencia, addMonths, getMonthLabel } from '@/lib/categories'
import type { ViewMode } from '@/lib/types'

export default function DashboardPage() {
  const [competencia, setCompetencia] = useState(toCompetencia(new Date()))
  const [viewMode, setViewMode] = useState<ViewMode>('competencia')
  const [sheetOpen, setSheetOpen] = useState(false)

  const prevCompetencia = addMonths(competencia, -1)

  const { data: txCurrent = [] } = useDashboardTransactions(competencia, viewMode)
  const { data: txPrev = [] } = useDashboardTransactions(prevCompetencia, viewMode)
  const { data: evolutionRaw = [] } = useMonthlyEvolution(6, viewMode)

  const totalExpenses = useMemo(
    () => txCurrent.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [txCurrent]
  )
  const totalIncome = useMemo(
    () => txCurrent.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [txCurrent]
  )
  const balance = totalIncome - totalExpenses

  const prevExpenses = useMemo(
    () => txPrev.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [txPrev]
  )
  const prevIncome = useMemo(
    () => txPrev.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [txPrev]
  )
  const prevBalance = prevIncome - prevExpenses

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, { category: { id: string; name: string; icon: string; color: string; sort_order: number }; total: number }>()
    for (const tx of txCurrent) {
      if (tx.type !== 'expense' || !tx.subcategory?.category) continue
      const cat = tx.subcategory.category
      const existing = map.get(cat.id)
      if (existing) {
        existing.total += tx.amount
      } else {
        map.set(cat.id, { category: cat, total: tx.amount })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [txCurrent])

  const monthlyEvolution = useMemo(() => {
    const map = new Map<string, { expenses: number; income: number }>()
    const dateKey = (tx: typeof evolutionRaw[0]) =>
      viewMode === 'competencia' ? tx.competencia : tx.date?.slice(0, 7) + '-01'

    for (const tx of evolutionRaw) {
      const key = dateKey(tx)
      if (!key) continue
      const existing = map.get(key) ?? { expenses: 0, income: 0 }
      if (tx.type === 'expense') existing.expenses += tx.amount
      else existing.income += tx.amount
      map.set(key, existing)
    }

    return Array.from(map.entries())
      .map(([month, vals]) => ({ month, ...vals }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [evolutionRaw, viewMode])

  return (
    <div className="relative">
      <MonthSelector
        competencia={competencia}
        viewMode={viewMode}
        onChangeCompetencia={setCompetencia}
        onToggleViewMode={() => setViewMode(v => v === 'competencia' ? 'caixa' : 'competencia')}
      />

      <HeroCard totalExpenses={totalExpenses} prevMonthExpenses={prevExpenses} />

      <SummaryCards
        totalIncome={totalIncome}
        balance={balance}
        prevMonthIncome={prevIncome}
        prevMonthBalance={prevBalance}
      />

      <CategoryBars expensesByCategory={expensesByCategory} totalExpenses={totalExpenses} />

      <MonthlyChart data={monthlyEvolution} currentMonth={competencia} />

      <CompositionChart
        expensesByCategory={expensesByCategory}
        totalExpenses={totalExpenses}
        monthLabel={getMonthLabel(competencia)}
      />

      <TopExpenses transactions={txCurrent} />

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 flex items-center gap-2 bg-foreground text-background px-5 py-3.5 rounded-full shadow-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus size={18} />
        Novo lançamento
      </button>

      <NewTransactionSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
