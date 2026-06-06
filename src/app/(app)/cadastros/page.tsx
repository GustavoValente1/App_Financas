'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import {
  useCategories,
  usePaymentSources,
  useIncomeSources,
  useAddSubcategory,
  useDeleteSubcategoryWithReassign,
  useAddPaymentSource,
  useDeletePaymentSource,
  useAddIncomeSource,
  useDeleteIncomeSource,
} from '@/hooks/useCategories'
import { getCategoryColor, getCategoryIcon } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { Subcategory } from '@/lib/types'

export default function CadastrosPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-5">Cadastros</h1>
      <Tabs defaultValue="categories">
        <TabsList className="w-full mb-5 bg-card rounded-xl p-1">
          <TabsTrigger value="categories" className="flex-1 rounded-lg">Categorias</TabsTrigger>
          <TabsTrigger value="fontes" className="flex-1 rounded-lg">Fontes</TabsTrigger>
          <TabsTrigger value="receitas" className="flex-1 rounded-lg">Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="fontes"><SimpleListTab type="payment_sources" /></TabsContent>
        <TabsContent value="receitas"><SimpleListTab type="income_sources" /></TabsContent>
      </Tabs>
    </div>
  )
}

function CategoriesTab() {
  const { data: categories = [] } = useCategories()
  const addSub = useAddSubcategory()
  const deleteWithReassign = useDeleteSubcategoryWithReassign()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState<Record<string, string>>({})
  const [pendingDelete, setPendingDelete] = useState<{ sub: Subcategory; targetId: string } | null>(null)

  async function handleAddSub(categoryId: string) {
    const name = newSubName[categoryId]?.trim()
    if (!name) return
    await addSub.mutateAsync({ name, category_id: categoryId })
    setNewSubName(prev => ({ ...prev, [categoryId]: '' }))
  }

  function initiateDelete(sub: Subcategory) {
    const others = categories.flatMap(c => (c.subcategories ?? []).filter(s => s.id !== sub.id))
    setPendingDelete({ sub, targetId: others[0]?.id ?? '' })
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteWithReassign.mutateAsync({
      id: pendingDelete.sub.id,
      targetId: pendingDelete.targetId || null,
    })
    setPendingDelete(null)
  }

  const otherSubcategories = pendingDelete
    ? categories.flatMap(cat => (cat.subcategories ?? []).filter(s => s.id !== pendingDelete.sub.id))
    : []

  return (
    <>
      <div className="flex flex-col gap-2">
        {categories.map(cat => {
          const isOpen = expandedId === cat.id
          const color = getCategoryColor(cat.name)
          const icon = getCategoryIcon(cat.name)
          return (
            <div key={cat.id} className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : cat.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: color + '20' }}
                >
                  {icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.subcategories?.length ?? 0} itens</p>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-border">
                  <div className="flex flex-wrap gap-2 mt-3 mb-3">
                    {cat.subcategories?.map(sub => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-background group"
                      >
                        <span>{sub.name}</span>
                        <button
                          onClick={() => initiateDelete(sub)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova subcategoria"
                      value={newSubName[cat.id] ?? ''}
                      onChange={e => setNewSubName(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSub(cat.id) }}
                      className="h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddSub(cat.id)}
                      disabled={addSub.isPending}
                      className="h-9 px-3"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={!!pendingDelete} onOpenChange={v => { if (!v) setPendingDelete(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Excluir subcategoria</DialogTitle>
            <DialogDescription>
              Para qual subcategoria os lançamentos de{' '}
              <strong>"{pendingDelete?.sub.name}"</strong> devem ser movidos?
            </DialogDescription>
          </DialogHeader>

          {otherSubcategories.length > 0 ? (
            <Select
              value={pendingDelete?.targetId || undefined}
              onValueChange={v => setPendingDelete(p => p ? { ...p, targetId: v ?? '' } : p)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar subcategoria…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => {
                  const subs = (cat.subcategories ?? []).filter(s => s.id !== pendingDelete?.sub.id)
                  if (subs.length === 0) return null
                  return (
                    <SelectGroup key={cat.id}>
                      <SelectLabel style={{ color: getCategoryColor(cat.name) }}>
                        {getCategoryIcon(cat.name)} {cat.name}
                      </SelectLabel>
                      {subs.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )
                })}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              Não há outras subcategorias disponíveis. Os lançamentos ficarão sem subcategoria.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteWithReassign.isPending || (otherSubcategories.length > 0 && !pendingDelete?.targetId)}
            >
              {deleteWithReassign.isPending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SimpleListTab({ type }: { type: 'payment_sources' | 'income_sources' }) {
  const isPayment = type === 'payment_sources'
  const { data: paymentSources = [] } = usePaymentSources()
  const { data: incomeSources = [] } = useIncomeSources()
  const addPayment = useAddPaymentSource()
  const deletePayment = useDeletePaymentSource()
  const addIncome = useAddIncomeSource()
  const deleteIncome = useDeleteIncomeSource()

  const items = isPayment ? paymentSources : incomeSources
  const addMutation = isPayment ? addPayment : addIncome
  const deleteMutation = isPayment ? deletePayment : deleteIncome

  const [newName, setNewName] = useState('')
  const [confirmItem, setConfirmItem] = useState<{ id: string; name: string } | null>(null)

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    await addMutation.mutateAsync(name)
    setNewName('')
  }

  async function handleConfirmDelete() {
    if (!confirmItem) return
    await deleteMutation.mutateAsync(confirmItem.id)
    setConfirmItem(null)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div
            key={item.id}
            className="bg-card rounded-2xl px-4 py-3.5 shadow-sm flex items-center justify-between"
          >
            <span className="text-sm font-medium">{item.name}</span>
            <button
              onClick={() => setConfirmItem({ id: item.id, name: item.name })}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <div className="flex gap-2 mt-2">
          <Input
            placeholder={isPayment ? 'Nova fonte…' : 'Nova origem…'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            className="bg-card"
          />
          <Button onClick={handleAdd} disabled={addMutation.isPending}>
            <Plus size={16} />
          </Button>
        </div>
      </div>

      <Dialog open={!!confirmItem} onOpenChange={v => { if (!v) setConfirmItem(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{' '}
              <strong>"{confirmItem?.name}"</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmItem(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
