'use client'

import { useState, useMemo, useRef } from 'react'
import { Search, X, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { NewTransactionSheet } from '@/components/transaction/NewTransactionSheet'
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions'
import { useCategories, usePaymentSources } from '@/hooks/useCategories'
import { formatCurrency, getCategoryColor, getCategoryIcon, getMonthYearLabel, toCompetencia } from '@/lib/categories'
import type { Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useMemo(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function SwipeableRow({
  children,
  onDelete,
  onClick,
}: {
  children: React.ReactNode
  onDelete: () => void
  onClick: () => void
}) {
  const [offset, setOffset] = useState(0)
  const [released, setReleased] = useState(true)
  const startX = useRef(0)
  const startY = useRef(0)
  const dragging = useRef(false)
  const DELETE_WIDTH = 72

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    dragging.current = false
    setReleased(false)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (!dragging.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        dragging.current = true
      } else {
        return
      }
    }
    if (dx < 0) setOffset(Math.max(dx, -DELETE_WIDTH))
  }

  function handleTouchEnd() {
    setReleased(true)
    setOffset(prev => (prev <= -DELETE_WIDTH * 0.5 ? -DELETE_WIDTH : 0))
  }

  function handleClick() {
    if (dragging.current || offset !== 0) {
      setOffset(0)
      return
    }
    onClick()
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 rounded-r-2xl"
        style={{ width: DELETE_WIDTH }}
      >
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="flex flex-col items-center justify-center gap-1 text-white w-full h-full"
        >
          <Trash2 size={18} />
          <span className="text-xs font-medium">Excluir</span>
        </button>
      </div>
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: released ? 'transform 0.2s ease-out' : 'none',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  )
}

export default function LancamentosPage() {
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const { data: allTransactions = [], isLoading } = useTransactions({
    search: debouncedSearch || undefined,
    month: selectedMonth || undefined,
    category_id: selectedCategoryId || undefined,
    payment_source_id: selectedSourceId || undefined,
  })

  const { data: categories = [] } = useCategories()
  const { data: paymentSources = [] } = usePaymentSources()
  const deleteTx = useDeleteTransaction()

  const totalFiltered = useMemo(
    () => allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [allTransactions]
  )

  const hasActiveFilter = !!(debouncedSearch || selectedMonth || selectedCategoryId || selectedSourceId)

  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = toCompetencia(d)
      return { value: val, label: getMonthYearLabel(val) }
    })
  }, [])

  function openEdit(tx: Transaction) {
    setEditTx(tx)
    setSheetOpen(true)
  }

  function clearFilters() {
    setSearch('')
    setSelectedMonth('')
    setSelectedCategoryId('')
    setSelectedSourceId('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Lançamentos</h1>
        <span className="text-sm text-muted-foreground">{allTransactions.length} itens</span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por descrição…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className={cn(
            'text-sm border rounded-full px-3 py-1.5 bg-card cursor-pointer outline-none',
            selectedMonth ? 'bg-foreground text-background border-transparent' : 'border-border text-muted-foreground'
          )}
        >
          <option value="">Todos os meses</option>
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          value={selectedCategoryId}
          onChange={e => setSelectedCategoryId(e.target.value)}
          className={cn(
            'text-sm border rounded-full px-3 py-1.5 bg-card cursor-pointer outline-none',
            selectedCategoryId ? 'text-white border-transparent' : 'border-border text-muted-foreground'
          )}
          style={selectedCategoryId ? {
            backgroundColor: getCategoryColor(categories.find(c => c.id === selectedCategoryId)?.name ?? '')
          } : {}}
        >
          <option value="">Categoria</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{getCategoryIcon(c.name)} {c.name}</option>
          ))}
        </select>

        <select
          value={selectedSourceId}
          onChange={e => setSelectedSourceId(e.target.value)}
          className={cn(
            'text-sm border rounded-full px-3 py-1.5 bg-card cursor-pointer outline-none',
            selectedSourceId ? 'bg-foreground text-background border-transparent' : 'border-border text-muted-foreground'
          )}
        >
          <option value="">Fonte</option>
          {paymentSources.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {hasActiveFilter && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Filtered total */}
      {hasActiveFilter && (
        <div className="flex justify-between text-sm mb-3 px-1">
          <span className="text-muted-foreground">Resultado filtrado</span>
          <span className="font-medium">{formatCurrency(totalFiltered)}</span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : allTransactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {hasActiveFilter ? 'Nenhum lançamento encontrado.' : 'Nenhum lançamento ainda.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {allTransactions.map(tx => {
            const catColor = tx.subcategory?.category
              ? getCategoryColor(tx.subcategory.category.name)
              : '#94a3b8'
            const catIcon = tx.subcategory?.category
              ? getCategoryIcon(tx.subcategory.category.name)
              : '💰'
            return (
              <SwipeableRow
                key={tx.id}
                onDelete={() => deleteTx.mutateAsync(tx.id)}
                onClick={() => openEdit(tx)}
              >
                <div className="bg-card rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: catColor + '20' }}
                  >
                    {tx.type === 'income' ? '💰' : catIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {tx.description || tx.subcategory?.name || tx.income_source?.name || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.type === 'expense'
                        ? `${tx.subcategory?.category?.name ?? ''} · ${tx.subcategory?.name ?? ''} · ${formatDateBR(tx.date)}`
                        : `${tx.income_source?.name ?? 'Receita'} · ${formatDateBR(tx.date)}`
                      }
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'text-sm font-medium',
                      tx.type === 'income' ? 'text-green-600' : 'text-foreground'
                    )}>
                      {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              </SwipeableRow>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setEditTx(null); setSheetOpen(true) }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 flex items-center gap-2 bg-foreground text-background px-5 py-3.5 rounded-full shadow-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus size={18} />
        Novo lançamento
      </button>

      <NewTransactionSheet
        open={sheetOpen}
        onOpenChange={v => { if (!v) setEditTx(null); setSheetOpen(v) }}
        editTransaction={editTx}
      />
    </div>
  )
}
