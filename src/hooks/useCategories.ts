import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Category, Subcategory, PaymentSource, IncomeSource } from '@/lib/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*, subcategories(*)')
        .order('sort_order')
      if (error) throw error
      return data as (Category & { subcategories: Subcategory[] })[]
    },
  })
}

export function useSubcategories() {
  return useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subcategories')
        .select('*, category:categories(*)')
        .order('sort_order')
      if (error) throw error
      return data as (Subcategory & { category: Category })[]
    },
  })
}

export function usePaymentSources() {
  return useQuery({
    queryKey: ['payment_sources'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('payment_sources').select('*')
      if (error) throw error
      return data as PaymentSource[]
    },
  })
}

export function useIncomeSources() {
  return useQuery({
    queryKey: ['income_sources'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('income_sources').select('*')
      if (error) throw error
      return data as IncomeSource[]
    },
  })
}

export function useAddSubcategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, category_id }: { name: string; category_id: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from('subcategories').insert({ name, category_id, sort_order: 99 })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteSubcategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('subcategories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useAddPaymentSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('payment_sources').insert({ name })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_sources'] }),
  })
}

export function useDeletePaymentSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('payment_sources').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_sources'] }),
  })
}

export function useAddIncomeSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('income_sources').insert({ name })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income_sources'] }),
  })
}

export function useDeleteIncomeSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('income_sources').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income_sources'] }),
  })
}
