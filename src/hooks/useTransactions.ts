import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Transaction, ViewMode } from '@/lib/types'
import { toCompetencia } from '@/lib/categories'

const TRANSACTION_SELECT = `
  *,
  subcategory:subcategories(*, category:categories(*)),
  income_source:income_sources(*),
  payment_source:payment_sources(*)
`

export interface TransactionFilters {
  search?: string
  month?: string
  category_id?: string
  subcategory_id?: string
  payment_source_id?: string
  min_amount?: number
  max_amount?: number
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
        .order('date', { ascending: false })

      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`)
      }
      if (filters.month) {
        const start = filters.month
        const [y, m] = filters.month.split('-').map(Number)
        const end = new Date(y, m, 0).toISOString().split('T')[0]
        query = query.gte('date', start).lte('date', end)
      }
      if (filters.subcategory_id) {
        query = query.eq('subcategory_id', filters.subcategory_id)
      }
      if (filters.payment_source_id) {
        query = query.eq('payment_source_id', filters.payment_source_id)
      }
      if (filters.min_amount !== undefined) {
        query = query.gte('amount', filters.min_amount)
      }
      if (filters.max_amount !== undefined) {
        query = query.lte('amount', filters.max_amount)
      }

      const { data, error } = await query
      if (error) throw error

      let result = data as Transaction[]

      if (filters.category_id) {
        result = result.filter(t => t.subcategory?.category?.id === filters.category_id)
      }

      return result
    },
  })
}

export function useDashboardTransactions(start: string, end: string, viewMode: ViewMode) {
  return useQuery({
    queryKey: ['dashboard', start, end, viewMode],
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)

      if (viewMode === 'competencia') {
        query = query.gte('competencia', start).lte('competencia', end)
      } else {
        const [ey, em] = end.split('-').map(Number)
        const dateEnd = new Date(ey, em, 0).toISOString().split('T')[0]
        query = query.gte('date', start).lte('date', dateEnd)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Transaction[]
    },
  })
}

export function useMonthlyEvolution(start: string, end: string, viewMode: ViewMode) {
  return useQuery({
    queryKey: ['monthly-evolution', start, end, viewMode],
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('transactions')
        .select('type, amount, competencia, date')

      if (viewMode === 'competencia') {
        query = query.gte('competencia', start).lte('competencia', end)
      } else {
        const [ey, em] = end.split('-').map(Number)
        const dateEnd = new Date(ey, em, 0).toISOString().split('T')[0]
        query = query.gte('date', start).lte('date', dateEnd)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

interface UpsertTransaction {
  id?: string
  type: 'expense' | 'income'
  amount: number
  description?: string | null
  date: string
  competencia: string
  subcategory_id?: string | null
  income_source_id?: string | null
  payment_source_id?: string | null
}

export function useUpsertTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tx: UpsertTransaction) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (tx.id) {
        const { error } = await supabase
          .from('transactions')
          .update({ ...tx, user_id: user.id })
          .eq('id', tx.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert({ ...tx, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['monthly-evolution'] })
    },
  })
}

export function useYearTransactions(year: number, viewMode: ViewMode) {
  return useQuery({
    queryKey: ['year-transactions', year, viewMode],
    queryFn: async () => {
      const supabase = createClient()
      const start = `${year}-01-01`
      const end = `${year}-12-31`

      let query = supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)

      if (viewMode === 'competencia') {
        query = query.gte('competencia', start).lte('competencia', end)
      } else {
        query = query.gte('date', start).lte('date', end)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Transaction[]
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['monthly-evolution'] })
    },
  })
}
