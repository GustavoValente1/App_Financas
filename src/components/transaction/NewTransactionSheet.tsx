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

  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [incomeSourceId, setIncomeSourceId] = useState('')
  const [paymentSourceId, setPaymentSourceId] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today)
  const [competencia, setCompetencia] = useState(today)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [errorMessage, setErrorMessage] = useState('')

  const { data: categories = [] } = useCategories()
  const { data: paymentSources = [] } = usePaymentSources()
  const { data: incomeSources = [] } = useIncomeSources()
  const upsert = useUpsertTransaction()
  const deleteTx = useDeleteTransaction()

  const defaultPaymentSource = paymentSources.find(s => s.name === 'Itaú - Latam Cabelinho') ?? paymentSources[0]

  const subcategoryItems = categories.reduce<Record<string, string>>((acc, cat) => {
    cat.subcategories?.forEach(sub => { acc[sub.id] = sub.name })
    return acc
  }, {})
  const paymentSourceItems = paymentSources.reduce<Record<string, string>>((acc, src) => {
    acc[src.id] = src.name
    return acc
  }, {})
  const incomeSourceItems = incomeSources.reduce<Record<string, string>>((acc, src) => {
    acc[src.id] = src.name
    return acc
  }, {})

  useEffect(() => {
    if (!open) return
    setType(editTransaction?.type ?? 'expense')
    setSubcategoryId(editTransaction?.subcategory_id ?? '')
    setIncomeSourceId(editTransaction?.income_source_id ?? '')
    setPaymentSourceId(editTransaction?.payment_source_id ?? '')
    setAmountDisplay(editTransaction ? formatAmt(editTransaction.amount) : '')
    setDescription(editTransaction?.description ?? '')
    setDate(editTransaction?.date ?? today)
    setCompetencia(editTransaction ? editTransaction.competencia.slice(0, 10) : today)
    setErrors({})
    setErrorMessage('')
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
    const effectiveExpenseSourceId = paymentSourceId || defaultPaymentSource?.id || ''

    const newErrors: Record<string, boolean> = {
      amount: !numAmount || numAmount <= 0,
      competencia: !competencia,
      date: !date,
      description: !description.trim(),
      subcategory: type === 'expense' && !subcategoryId,
      fonte: type === 'expense' && !effectiveExpenseSourceId,
      incomeSource: type === 'income' && !incomeSourceId,
      paymentSource: type === 'income' && !paymentSourceId,
    }
    setErrors(newErrors)

    if (Object.values(newErrors).some(Boolean)) {
      setErrorMessage('Preencha todos os campos destacados em vermelho antes de salvar.')
      return
    }
    setErrorMessage('')

    await upsert.mutateAsync({
      id: editTransaction?.id,
      type,
      amount: numAmount,
      description: description || null,
      date,
      competencia,
      subcategory_id: type === 'expense' ? subcategoryId : null,
      income_source_id: type === 'income' ? incomeSourceId : null,
      payment_source_id: type === 'expense'
        ? (effectiveExpenseSourceId || null)
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
            <p className={cn('text-xs uppercase tracking-wide mb-1.5', errors.amount ? 'text-destructive' : 'text-muted-foreground')}>Valor</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amountDisplay}
                aria-invalid={errors.amount}
                onChange={e => { setAmountDisplay(e.target.value.replace(/[^0-9.,]/g, '')); setErrors(err => ({ ...err, amount: false })) }}
                onBlur={handleAmountBlur}
                className="pl-9 text-lg font-medium"
              />
            </div>
          </div>

          {/* Data competência */}
          <div>
            <p className={cn('text-xs uppercase tracking-wide mb-1.5', errors.competencia ? 'text-destructive' : 'text-muted-foreground')}>Data competência</p>
            <Input
              type="date"
              value={competencia}
              aria-invalid={errors.competencia}
              onChange={e => { setCompetencia(e.target.value); setErrors(err => ({ ...err, competencia: false })) }}
            />
          </div>

          {/* Data pagamento */}
          <div>
            <p className={cn('text-xs uppercase tracking-wide mb-1.5', errors.date ? 'text-destructive' : 'text-muted-foreground')}>Data pagamento</p>
            <Input
              type="date"
              value={date}
              aria-invalid={errors.date}
              onChange={e => { setDate(e.target.value); setErrors(err => ({ ...err, date: false })) }}
            />
          </div>

          {/* Descrição */}
          <div>
            <p className={cn('text-xs uppercase tracking-wide mb-1.5', errors.description ? 'text-destructive' : 'text-muted-foreground')}>Descrição</p>
            <Input
              placeholder="Ex: Supermercado BH"
              value={description}
              aria-invalid={errors.description}
              onChange={e => { setDescription(e.target.value); setErrors(err => ({ ...err, description: false })) }}
            />
          </div>

          {/* Subcategoria / Origem */}
          {type === 'expense' ? (
            <div>
              <p className={cn('text-xs uppercase tracking-wide mb-1.5', errors.subcategory ? 'text-destructive' : 'text-muted-foreground')}>Subcategoria</p>
              <Select
                items={subcategoryItems}
                value={subcategoryId || undefined}
                onValueChange={v => { setSubcategoryId(v ?? ''); setErrors(err => ({ ...err, subcategory: false })) }}
              >
                <SelectTrigger className="w-full h-10" aria-invalid={errors.subcategory}>
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
                <p className={cn('text-xs uppercase tracking-wide mb-1.5', errors.incomeSource ? 'text-destructive' : 'text-muted-foreground')}>Origem da receita</p>
                <Select
                  items={incomeSourceItems}
                  value={incomeSourceId || undefined}
                  onValueChange={v => { setIncomeSourceId(v ?? ''); setErrors(err => ({ ...err, incomeSource: false })) }}
                >
                  <SelectTrigger className="w-full h-10" aria-invalid={errors.incomeSource}>
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
                <p className={cn('text-xs uppercase tracking-wide mb-1.5', errors.paymentSource ? 'text-destructive' : 'text-muted-foreground')}>
                  Conta de destino <span className="text-destructive">*</span>
                </p>
                <Select
                  items={paymentSourceItems}
                  value={paymentSourceId || undefined}
                  onValueChange={v => { setPaymentSourceId(v ?? ''); setErrors(err => ({ ...err, paymentSource: false })) }}
                >
                  <SelectTrigger className="w-full h-10" aria-invalid={errors.paymentSource}>
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
              <p className={cn('text-xs uppercase tracking-wide mb-1.5', errors.fonte ? 'text-destructive' : 'text-muted-foreground')}>Fonte</p>
              <Select
                items={paymentSourceItems}
                value={effectivePaymentSourceId || undefined}
                onValueChange={v => { setPaymentSourceId(v ?? ''); setErrors(err => ({ ...err, fonte: false })) }}
              >
                <SelectTrigger className="w-full h-10" aria-invalid={errors.fonte}>
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

        {errorMessage && (
          <p className="text-sm text-destructive text-center mb-3">{errorMessage}</p>
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
