'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react'
import { useCategories, usePaymentSources, useIncomeSources } from '@/hooks/useCategories'
import { useYearTransactions, useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, toCompetencia, getMonthYearLabel } from '@/lib/categories'
import type { Transaction, ViewMode } from '@/lib/types'
import { cn } from '@/lib/utils'

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtCell(num: number): string {
  if (num === 0) return '–'
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function getMonthIdx(tx: Transaction, viewMode: ViewMode): number {
  const dateStr = viewMode === 'competencia' ? tx.competencia : tx.date
  return parseInt(dateStr.split('-')[1]) - 1
}

export default function RelatoriosPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-5">Relatórios</h1>
      <Tabs defaultValue="fluxo">
        <TabsList className="w-full mb-5 bg-card rounded-xl p-1">
          <TabsTrigger value="fluxo" className="flex-1 rounded-lg">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="conferencia" className="flex-1 rounded-lg">Conferência</TabsTrigger>
        </TabsList>
        <TabsContent value="fluxo"><FluxoCaixa /></TabsContent>
        <TabsContent value="conferencia"><Conferencia /></TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Fluxo de Caixa ───────────────────────────────────────────────────────────

function FluxoCaixa() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [viewMode, setViewMode] = useState<ViewMode>('competencia')

  const { data: transactions = [], isLoading } = useYearTransactions(year, viewMode)
  const { data: incomeSources = [] } = useIncomeSources()
  const { data: categories = [] } = useCategories()

  const fluxo = useMemo(() => {
    const incomeMap: Record<string, number[]> = {}
    for (const src of incomeSources) {
      incomeMap[src.name] = Array(12).fill(0)
    }
    const expenseMap: Record<string, number[]> = {}
    for (const cat of categories) {
      expenseMap[cat.name] = Array(12).fill(0)
    }

    for (const tx of transactions) {
      const mIdx = getMonthIdx(tx, viewMode)
      if (mIdx < 0 || mIdx > 11) continue
      if (tx.type === 'income') {
        const name = tx.income_source?.name ?? 'Outros'
        if (!incomeMap[name]) incomeMap[name] = Array(12).fill(0)
        incomeMap[name][mIdx] += tx.amount
      } else {
        const name = tx.subcategory?.category?.name ?? 'Outros'
        if (!expenseMap[name]) expenseMap[name] = Array(12).fill(0)
        expenseMap[name][mIdx] += tx.amount
      }
    }

    const incomeTotal = Array(12).fill(0)
    for (const amounts of Object.values(incomeMap)) {
      for (let i = 0; i < 12; i++) incomeTotal[i] += amounts[i]
    }

    const expenseTotal = Array(12).fill(0)
    for (const amounts of Object.values(expenseMap)) {
      for (let i = 0; i < 12; i++) expenseTotal[i] += amounts[i]
    }

    const saldo = Array(12).fill(0).map((_, i) => incomeTotal[i] - expenseTotal[i])

    let acc = 0
    const saldoAcumulado: number[] = []
    for (let i = 0; i < 12; i++) {
      if (incomeTotal[i] > 0 || expenseTotal[i] > 0) {
        acc += saldo[i]
      }
      saldoAcumulado.push(acc)
    }

    const incomeRows = Object.entries(incomeMap).filter(([, a]) => a.some(v => v > 0))
    const expenseRows = Object.entries(expenseMap).filter(([, a]) => a.some(v => v > 0))

    return { incomeRows, expenseRows, incomeTotal, expenseTotal, saldo, saldoAcumulado }
  }, [transactions, viewMode, incomeSources, categories])

  function rowTotal(amounts: number[]): number {
    return amounts.reduce((s, a) => s + a, 0)
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
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

        <div className="flex bg-muted rounded-xl p-1">
          <button
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', viewMode === 'competencia' ? 'bg-foreground text-background' : 'text-muted-foreground')}
            onClick={() => setViewMode('competencia')}
          >
            Competência
          </button>
          <button
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', viewMode === 'caixa' ? 'bg-foreground text-background' : 'text-muted-foreground')}
            onClick={() => setViewMode('caixa')}
          >
            Caixa
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 bg-card rounded-2xl animate-pulse" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="min-w-[900px] w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2.5 font-semibold min-w-[140px]">Descrição</th>
                {MONTH_LABELS.map(m => (
                  <th key={m} className="text-right px-2 py-2.5 font-semibold min-w-[68px]">{m}</th>
                ))}
                <th className="text-right px-3 py-2.5 font-semibold min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Income rows */}
              {fluxo.incomeRows.map(([name, amounts]) => (
                <tr key={name} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="px-3 py-2">{name}</td>
                  {amounts.map((amt, i) => (
                    <td key={i} className="text-right px-2 py-2">{fmtCell(amt)}</td>
                  ))}
                  <td className="text-right px-3 py-2 font-medium">{fmtCell(rowTotal(amounts))}</td>
                </tr>
              ))}

              {/* Income total */}
              <tr className="border-b border-border bg-blue-50/60 dark:bg-blue-950/20">
                <td className="px-3 py-2.5 font-bold text-blue-700 dark:text-blue-400">Receitas Total</td>
                {fluxo.incomeTotal.map((amt, i) => (
                  <td key={i} className="text-right px-2 py-2.5 font-bold text-blue-700 dark:text-blue-400">
                    {fmtCell(amt)}
                  </td>
                ))}
                <td className="text-right px-3 py-2.5 font-bold text-blue-700 dark:text-blue-400">
                  {fmtCell(rowTotal(fluxo.incomeTotal))}
                </td>
              </tr>

              {/* Spacer */}
              <tr className="h-2 border-b border-border/20"><td colSpan={14} /></tr>

              {/* Expense rows */}
              {fluxo.expenseRows.map(([name, amounts]) => (
                <tr key={name} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="px-3 py-2">{name}</td>
                  {amounts.map((amt, i) => (
                    <td key={i} className="text-right px-2 py-2">{fmtCell(amt)}</td>
                  ))}
                  <td className="text-right px-3 py-2 font-medium">{fmtCell(rowTotal(amounts))}</td>
                </tr>
              ))}

              {/* Expense total */}
              <tr className="border-b border-border bg-red-50/60 dark:bg-red-950/20">
                <td className="px-3 py-2.5 font-bold text-red-600 dark:text-red-400">Despesas Total</td>
                {fluxo.expenseTotal.map((amt, i) => (
                  <td key={i} className="text-right px-2 py-2.5 font-bold text-red-600 dark:text-red-400">
                    {fmtCell(amt)}
                  </td>
                ))}
                <td className="text-right px-3 py-2.5 font-bold text-red-600 dark:text-red-400">
                  {fmtCell(rowTotal(fluxo.expenseTotal))}
                </td>
              </tr>

              {/* Saldo */}
              <tr className="border-b border-border bg-muted/40">
                <td className="px-3 py-2.5 font-bold">Saldo</td>
                {fluxo.saldo.map((amt, i) => (
                  <td key={i} className={cn('text-right px-2 py-2.5 font-bold', amt < 0 ? 'text-red-600' : '')}>
                    {fmtCell(amt)}
                  </td>
                ))}
                <td className={cn('text-right px-3 py-2.5 font-bold', rowTotal(fluxo.saldo) < 0 ? 'text-red-600' : '')}>
                  {fmtCell(rowTotal(fluxo.saldo))}
                </td>
              </tr>

              {/* Saldo acumulado */}
              <tr className="bg-muted/20">
                <td className="px-3 py-2.5 font-semibold">Saldo acumulado</td>
                {fluxo.saldoAcumulado.map((amt, i) => (
                  <td key={i} className={cn('text-right px-2 py-2.5 font-semibold', amt < 0 ? 'text-red-600' : '')}>
                    {fmtCell(amt)}
                  </td>
                ))}
                <td className={cn('text-right px-3 py-2.5 font-semibold', (fluxo.saldoAcumulado[11] ?? 0) < 0 ? 'text-red-600' : '')}>
                  {fmtCell(fluxo.saldoAcumulado[11] ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Conferência de Extrato ───────────────────────────────────────────────────

function Conferencia() {
  const today = new Date().toISOString().split('T')[0]

  const { data: paymentSources = [] } = usePaymentSources()
  const { data: allTransactions = [], isLoading } = useTransactions({})

  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = toCompetencia(d)
      return { value: val, label: getMonthYearLabel(val) }
    })
  }, [])

  const [expandFilter, setExpandFilter] = useState('')

  const incomeWithoutSource = useMemo(
    () => allTransactions.filter(t => t.type === 'income' && !t.payment_source_id),
    [allTransactions]
  )

  const bySource = useMemo(() => {
    const map: Record<string, { name: string; txs: Transaction[]; balance: number; lastDate: string }> = {}

    for (const src of paymentSources) {
      map[src.id] = { name: src.name, txs: [], balance: 0, lastDate: '' }
    }

    for (const tx of allTransactions) {
      const srcId = tx.payment_source_id
      if (!srcId) continue
      if (!map[srcId]) {
        map[srcId] = { name: tx.payment_source?.name ?? 'Desconhecida', txs: [], balance: 0, lastDate: '' }
      }
      map[srcId].txs.push(tx)
      map[srcId].balance += tx.type === 'income' ? tx.amount : -tx.amount
      if (!map[srcId].lastDate || tx.date > map[srcId].lastDate) {
        map[srcId].lastDate = tx.date
      }
    }

    return Object.values(map)
      .filter(s => s.txs.length > 0)
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate))
  }, [paymentSources, allTransactions])

  return (
    <div>
      {/* Warning for income without source */}
      {incomeWithoutSource.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <span className="text-amber-800 dark:text-amber-300">
            <strong>{incomeWithoutSource.length} receita(s)</strong> sem conta atribuída — edite-as para incluir no saldo.
          </span>
        </div>
      )}

      {/* Source cards */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}
        </div>
      ) : bySource.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">Nenhum lançamento com fonte atribuída.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {bySource.map(({ name, txs, balance, lastDate }) => (
            <SourceCard
              key={name}
              name={name}
              transactions={txs}
              balance={balance}
              lastDate={lastDate}
              filterMonth={expandFilter}
              months={months}
              onFilterChange={setExpandFilter}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SourceCard({
  name,
  transactions,
  balance,
  lastDate,
  filterMonth,
  months,
  onFilterChange,
}: {
  name: string
  transactions: Transaction[]
  balance: number
  lastDate: string
  filterMonth: string
  months: { value: string; label: string }[]
  onFilterChange: (v: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const visibleTxs = useMemo(() => {
    let txs = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number)
      const start = filterMonth
      const end = new Date(y, m, 0).toISOString().split('T')[0]
      txs = txs.filter(tx => tx.date >= start && tx.date <= end)
    }
    return txs
  }, [transactions, filterMonth])

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <div className="text-left">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            Última atualização: {lastDate ? formatDateBR(lastDate) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={cn('text-sm font-semibold', balance < 0 ? 'text-red-600' : 'text-foreground')}>
              {formatCurrency(balance)}
            </p>
          </div>
          <ChevronDown size={16} className={cn('text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Period filter inside card */}
          <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Período:</span>
            <select
              value={filterMonth}
              onChange={e => onFilterChange(e.target.value)}
              className="text-xs border rounded-full px-2.5 py-1 bg-background cursor-pointer outline-none border-border"
            >
              <option value="">Todo o histórico</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {visibleTxs.length === 0 ? (
            <p className="px-4 py-4 text-xs text-muted-foreground text-center">
              Nenhum lançamento neste período.
            </p>
          ) : (
            visibleTxs.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {tx.description || tx.subcategory?.name || tx.income_source?.name || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateBR(tx.date)}
                    {tx.type === 'expense' && tx.subcategory?.category?.name
                      ? ` · ${tx.subcategory.category.name} · ${tx.subcategory.name}`
                      : tx.type === 'income' && tx.income_source?.name
                        ? ` · ${tx.income_source.name}`
                        : ''}
                  </p>
                </div>
                <span className={cn('text-sm font-medium ml-3 flex-shrink-0', tx.type === 'income' ? 'text-green-600' : '')}>
                  {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
