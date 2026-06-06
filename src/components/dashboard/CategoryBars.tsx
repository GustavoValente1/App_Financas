'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency, getCategoryColor, getCategoryIcon } from '@/lib/categories'
import type { Category, Transaction } from '@/lib/types'

interface Props {
  expensesByCategory: { category: Category; total: number }[]
  totalExpenses: number
  transactions: Transaction[]
}

export function CategoryBars({ expensesByCategory, totalExpenses, transactions }: Props) {
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null)

  if (!expensesByCategory.length) return null

  function toggleCategory(catId: string) {
    if (expandedCatId === catId) {
      setExpandedCatId(null)
      setExpandedSubId(null)
    } else {
      setExpandedCatId(catId)
      setExpandedSubId(null)
    }
  }

  function toggleSubcategory(subId: string) {
    setExpandedSubId(prev => prev === subId ? null : subId)
  }

  function subcategoriesFor(catId: string) {
    const map = new Map<string, { id: string; name: string; total: number }>()
    for (const tx of transactions) {
      if (tx.type !== 'expense' || tx.subcategory?.category?.id !== catId) continue
      const sub = tx.subcategory!
      const entry = map.get(sub.id) ?? { id: sub.id, name: sub.name, total: 0 }
      entry.total += tx.amount
      map.set(sub.id, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }

  function transactionsFor(subId: string) {
    return transactions
      .filter(tx => tx.type === 'expense' && tx.subcategory?.id === subId)
      .sort((a, b) => b.amount - a.amount)
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm mb-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Pra onde foi</p>
      <div className="flex flex-col gap-1">
        {expensesByCategory.map(({ category, total }) => {
          const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
          const color = getCategoryColor(category.name)
          const icon = getCategoryIcon(category.name)
          const isCatOpen = expandedCatId === category.id
          const subcategories = isCatOpen ? subcategoriesFor(category.id) : []

          return (
            <div key={category.id}>
              {/* Linha da categoria */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full text-left py-2"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <span>{icon}</span>
                    <span>{category.name}</span>
                    {isCatOpen
                      ? <ChevronDown size={13} className="text-muted-foreground" />
                      : <ChevronRight size={13} className="text-muted-foreground" />
                    }
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
              </button>

              {/* Subcategorias */}
              {isCatOpen && subcategories.length > 0 && (
                <div className="ml-4 mb-1 flex flex-col gap-0.5 border-l-2 pl-3" style={{ borderColor: color + '50' }}>
                  {subcategories.map(sub => {
                    const isSubOpen = expandedSubId === sub.id
                    const txs = isSubOpen ? transactionsFor(sub.id) : []
                    const subPct = total > 0 ? (sub.total / total) * 100 : 0

                    return (
                      <div key={sub.id}>
                        <button
                          onClick={() => toggleSubcategory(sub.id)}
                          className="w-full text-left py-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {isSubOpen
                                ? <ChevronDown size={11} />
                                : <ChevronRight size={11} />
                              }
                              <span>{sub.name}</span>
                              <span className="text-border">·</span>
                              <span>{subPct.toFixed(0)}%</span>
                            </div>
                            <span className="text-xs font-medium text-foreground">
                              {formatCurrency(sub.total)}
                            </span>
                          </div>
                        </button>

                        {/* Lançamentos individuais */}
                        {isSubOpen && txs.length > 0 && (
                          <div className="ml-3 mb-1 flex flex-col gap-0.5">
                            {txs.map(tx => {
                              const [y, m, d] = tx.date.split('-')
                              return (
                                <div key={tx.id} className="flex items-center justify-between py-1 gap-2">
                                  <span className="text-xs text-muted-foreground shrink-0">{d}/{m}</span>
                                  <span className="text-xs text-muted-foreground truncate flex-1">
                                    {tx.description || tx.subcategory?.name || '—'}
                                  </span>
                                  <span className="text-xs font-medium text-foreground shrink-0">
                                    {formatCurrency(tx.amount)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
