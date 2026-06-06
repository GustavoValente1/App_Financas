'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Trash2, X } from 'lucide-react'
import { useCategories, usePaymentSources, useIncomeSources } from '@/hooks/useCategories'
import { useUpsertTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { getCategoryColor, getCategoryIcon } from '@/lib/categories'
import type { Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTransaction?: Transaction | null
}

function formatAmt(num: number): string {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseAmt(val: string): number {
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
}

export function NewTransactionSheet({ open, onOpenChange, editTransaction }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)

  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [incomeSourceId, setIncomeSourceId] = useState('')
  const [paymentSourceId, setPaymentSourceId] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today)
  const [competencia, setCompetencia] = useState(currentMonth)

  const { data: categories = [] } = useCategories()
  const { data: paymentSources = [] } = usePaymentSources()
  const { data: incomeSources = [] } = useIncomeSources()
  const upsert = useUpsertTransaction()
  const deleteTx = useDeleteTransaction()

  const defaultPaymentSource = paymentSources.find(s => s.name === 'Itaú - Latam Cabelinho') ?? paymentSources[0]

  useEffect(() => {
    if (!open) return
    setType(editTransaction?.type ?? 'expense')
    setSubcategoryId(editTransaction?.subcategory_id ?? '')
    setIncomeSourceId(editTransaction?.income_source_id ?? '')
    setPaymentSourceId(editTransaction?.payment_source_id ?? '')
    setAmountDisplay(editTransaction ? formatAmt(editTransaction.amount) : '')
    setDescription(editTransaction?.description ?? '')
    setDate(editTransaction?.date ?? today)
    setCompetencia(editTransaction ? editTransaction.competencia.slice(0, 7) : currentMonth)
  }, [open, editTransaction?.id])

  function handleAmountBlur() {
    const num = parseAmt(amountDisplay)
    if (num > 0) setAmountDisplay(formatAmt(num))
  }

  function close() { onOpenChange(false) }

  async function handleDelete() {
    if (!editTransaction) return
    if (!confirm('Excluir este lançamento?')) return
    await deleteTx.mutateAsync(editTransaction.id)
    close()
  }

  async function handleSave() {
    const numAmount = parseAmt(amountDisplay)
    if (!numAmount || numAmount <= 0) return
    if (type === 'expense' && !subcategoryId) return
    if (type === 'income' && !incomeSourceId) return
    if (type === 'income' && !paymentSourceId) return

    await upsert.mutateAsync({
      id: editTransaction?.id,
      type,
      amount: numAmount,
      description: description || null,
      date,
      competencia: competencia + '-01',
      subcategory_id: type === 'expense' ? subcategoryId : null,
      income_source_id: type === 'income' ? incomeSourceId : null,
      payment_source_id: type === 'expense'
        ? (paymentSourceId || defaultPaymentSource?.id || null)
        : (paymentSourceId || null),
    })

    close()
  }

  const effectivePaymentSourceId = paymentSourceId || defaultPaymentSource?.id || ''
  const isEditing = !!editTransaction

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) close() }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto px-4 pb-8">
        <SheetHeader className="flex-row items-center justify-between mb-4">
          <SheetTitle className="text-base font-medium">
            {isEditing ? 'Editar lançamento' : 'Novo lançamento'}
          </SheetTitle>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={deleteTx.isPending}
                className="p-1 text-destructive hover:opacity-70 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={close} className="text-muted-foreground hover:opacity-70 transition-opacity">
              <X size={18} />
            </button>
          </div>
        </SheetHeader>

        {/* Type toggle */}
        <div className="flex bg-muted rounded-xl p-1 mb-5">
          <button
            className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors', type === 'expense' ? 'bg-foreground text-background' : 'text-muted-foreground')}
            onClick={() => setType('expense')}
          >
            Despesa
          </button>
          <button
            className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors', type === 'income' ? 'bg-foreground text-background' : 'text-muted-foreground')}
            onClick={() => setType('income')}
          >
            Receita
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          {/* Valor */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Valor</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amountDisplay}
                onChange={e => setAmountDisplay(e.target.value.replace(/[^0-9.,]/g, ''))}
                onBlur={handleAmountBlur}
                className="pl-9 text-lg font-medium"
              />
            </div>
          </div>

          {/* Data competência */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Data competência</p>
            <Input
              type="month"
              value={competencia}
              onChange={e => setCompetencia(e.target.value)}
            />
          </div>

          {/* Data pagamento */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Data pagamento</p>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Descrição */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Descrição</p>
            <Input
              placeholder="Ex: Supermercado BH"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Subcategoria / Origem */}
          {type === 'expense' ? (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Subcategoria</p>
              <Select value={subcategoryId || undefined} onValueChange={v => setSubcategoryId(v ?? '')}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Selecionar subcategoria…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectGroup key={cat.id}>
                      <SelectLabel className="font-medium" style={{ color: getCategoryColor(cat.name) }}>
                        {getCategoryIcon(cat.name)} {cat.name}
                      </SelectLabel>
                      {cat.subcategories?.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Origem da receita</p>
                <Select value={incomeSourceId || undefined} onValueChange={v => setIncomeSourceId(v ?? '')}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Selecionar origem…" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeSources.map(src => (
                      <SelectItem key={src.id} value={src.id}>{src.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                  Conta de destino <span className="text-destructive">*</span>
                </p>
                <Select value={paymentSourceId || undefined} onValueChange={v => setPaymentSourceId(v ?? '')}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Em qual conta chegou o dinheiro…" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentSources.map(src => (
                      <SelectItem key={src.id} value={src.id}>{src.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Fonte (despesas) */}
          {type === 'expense' && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Fonte</p>
              <Select value={effectivePaymentSourceId || undefined} onValueChange={v => setPaymentSourceId(v ?? '')}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Selecionar fonte…" />
                </SelectTrigger>
                <SelectContent>
                  {paymentSources.map(src => (
                    <SelectItem key={src.id} value={src.id}>{src.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

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
