export interface Category {
  id: string
  name: string
  icon: string
  color: string
  sort_order: number
}

export interface Subcategory {
  id: string
  name: string
  category_id: string
  sort_order: number
  category?: Category
}

export interface PaymentSource {
  id: string
  name: string
}

export interface IncomeSource {
  id: string
  name: string
}

export type TransactionType = 'expense' | 'income'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string | null
  date: string
  competencia: string
  subcategory_id: string | null
  income_source_id: string | null
  payment_source_id: string | null
  created_at: string
  subcategory?: Subcategory & { category?: Category }
  income_source?: IncomeSource
  payment_source?: PaymentSource
}

export interface DashboardData {
  totalExpenses: number
  totalIncome: number
  balance: number
  prevMonthExpenses: number
  prevMonthIncome: number
  expensesByCategory: { category: Category; total: number }[]
  monthlyEvolution: { month: string; expenses: number; income: number }[]
  topExpenses: Transaction[]
}

export type ViewMode = 'competencia' | 'caixa'
