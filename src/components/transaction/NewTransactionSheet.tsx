'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useCategories, usePaymentSources, useIncomeSources } from '@/hooks/useCategories'
import { useUpsertTransaction } from '@/hooks/useTransactions'
import { toCompetencia, getCategoryColor } from '@/lib/categories'
import type { Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTransaction?: Transaction | null
}

export function NewTransactionSheet({ open, onOpenChange, editTransaction }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const currentCompetencia = toCompetencia(new Date())

  const isEditing = !!editTransaction

  const [type, setType] = useState<'expense' | 'income'>(editTransaction?.type ?? 'expense')
  const [subcategoryId, setSubcategoryId] = useState(editTransaction?.subcategory_id ?? '')
  const [incomeSourceId, setIncomeSourceId] = useState(editTransaction?.income_source_id ?? '')
  const [paymentSourceId, setPaymentSourceId] = useState(editTransaction?.payment_source_id ?? '')
  const [amount, setAmount] = useState(editTransaction ? String(editTransaction.amount) : '')
  const [description, setDescription] = useState(editTransaction?.description ?? '')
  const [date, setDate] = useState(editTransaction?.date ?? today)
  const [competencia, setCompetencia] = useState(editTransaction?.competencia ?? currentCompetencia)
  const [expanded, setExpanded] = useState(false)

  const { data: categories = [] } = useCategories()
  const { data: paymentSources = [] } = usePaymentSources()
  const { data: incomeSources = [] } = useIncomeSources()
  const upsert = useUpsertTransaction()

  const defaultPaymentSource = paymentSources.find(s => s.name === 'Itaú - Latam Cabelinho') ?? paymentSources[0]

  function reset() {
    setType('expense')
    setSubcategoryId('')
    setIncomeSourceId('')
    setPaymentSourceId('')
    setAmount('')
    setDescription('')
    setDate(today)
    setCompetencia(currentCompetencia)
    setExpanded(false)
  }

  async function handleSave() {
    const numAmount = parseFloat(amount.replace(',', '.'))
    if (!numAmount || numAmount <= 0) return
    if (type === 'expense' && !subcategoryId) return
    if (type === 'income' && !incomeSourceId) return

    await upsert.mutateAsync({
      id: editTransaction?.id,
      type,
      amount: numAmount,
      description: description || null,
      date,
      competencia,
      subcategory_id: type === 'expense' ? subcategoryId : null,
      income_source_id: type === 'income' ? incomeSourceId : null,
      payment_source_id: type === 'expense' ? (paymentSourceId || defaultPaymentSource?.id || null) : null,
    })

    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v) }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[90vh] overflow-y-auto px-4 pb-8"
      >
        <SheetHeader className="flex-row items-center justify-between mb-4">
          <SheetTitle className="text-base font-medium">
            {isEditing ? 'Editar lançamento' : 'Novo lançamento'}
          </SheetTitle>
          <button onClick={() => { reset(); onOpenChange(false) }} className="text-muted-foreground">
            <X size={18} />
          </button>
        </SheetHeader>

        {/* Type toggle */}
        <div className="flex bg-muted rounded-xl p-1 mb-5">
          <button
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              type === 'expense' ? 'bg-foreground text-background' : 'text-muted-foreground'
            )}
            onClick={() => setType('expense')}
          >
            Despesa
          </button>
          <button
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              type === 'income' ? 'bg-foreground text-background' : 'text-muted-foreground'
            )}
            onClick={() => setType('income')}
          >
            Receita
          </button>
        </div>

        {type === 'expense' ? (
          <>
            {/* Subcategory grid */}
            <div className="mb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5">
                Subcategoria
              </p>
              <div className="flex flex-col gap-3">
                {categories.map(cat => (
                  <div key={cat.id}>
                    <p className="text-xs font-medium mb-1.5" style={{ color: getCategoryColor(cat.name) }}>
                      {cat.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.subcategories?.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setSubcategoryId(sub.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm transition-colors border',
                            subcategoryId === sub.id
                              ? 'text-white border-transparent'
                              : 'bg-card text-foreground border-border hover:border-transparent hover:text-white'
                          )}
                          style={subcategoryId === sub.id
                            ? { backgroundColor: getCategoryColor(cat.name), borderColor: getCategoryColor(cat.name) }
                            : { '--hover-bg': getCategoryColor(cat.name) } as React.CSSProperties
                          }
                          onMouseEnter={e => {
                            if (subcategoryId !== sub.id) {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = getCategoryColor(cat.name)
                            }
                          }}
                          onMouseLeave={e => {
                            if (subcategoryId !== sub.id) {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''
                            }
                          }}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Income source list */
          <div className="mb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5">
              Origem da receita
            </p>
            <div className="flex flex-col gap-2">
              {incomeSources.map(src => (
                <button
                  key={src.id}
                  onClick={() => setIncomeSourceId(src.id)}
                  className={cn(
                    'py-3 px-4 rounded-xl text-sm text-left font-medium transition-colors border',
                    incomeSourceId === src.id
                      ? 'bg-foreground text-background border-transparent'
                      : 'bg-card text-foreground border-border hover:bg-muted'
                  )}
                >
                  {src.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Valor</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="pl-9 text-lg font-medium"
            />
          </div>
        </div>

        {/* Expandable extra fields */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Menos opções' : 'Mais opções'}
        </button>

        {expanded && (
          <div className="flex flex-col gap-3 mb-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Descrição</p>
              <Input
                placeholder="Ex: Supermercado BH"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Data</p>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                Competência
              </p>
              <Input type="month" value={competencia.slice(0, 7)} onChange={e => setCompetencia(e.target.value + '-01')} />
            </div>
            {type === 'expense' && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Fonte</p>
                <div className="flex flex-col gap-2">
                  {paymentSources.map(src => (
                    <button
                      key={src.id}
                      onClick={() => setPaymentSourceId(src.id)}
                      className={cn(
                        'py-2.5 px-4 rounded-xl text-sm text-left transition-colors border',
                        (paymentSourceId || defaultPaymentSource?.id) === src.id
                          ? 'bg-foreground text-background border-transparent'
                          : 'bg-card text-foreground border-border hover:bg-muted'
                      )}
                    >
                      {src.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={upsert.isPending}
          className="w-full py-6 text-base font-medium rounded-xl"
        >
          {upsert.isPending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Salvar'}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
