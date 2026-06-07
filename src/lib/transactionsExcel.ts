import * as XLSX from 'xlsx'
import type { Category, IncomeSource, PaymentSource, Subcategory, Transaction, TransactionType } from '@/lib/types'

const COLUMNS = {
  id: 'ID',
  type: 'Tipo',
  amount: 'Valor',
  competencia: 'Data Competência',
  date: 'Data Pagamento',
  description: 'Descrição',
  category: 'Categoria',
  subcategory: 'Subcategoria',
  paymentSource: 'Fonte',
  incomeSource: 'Origem da Receita',
} as const

const TYPE_LABEL: Record<TransactionType, string> = {
  expense: 'Despesa',
  income: 'Receita',
}

function formatDateBR(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function isoFromBR(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const [, d, m, y] = match
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const EXCEL_EPOCH = Date.UTC(1899, 11, 30)

function isoFromExcelSerial(serial: number): string | null {
  if (!Number.isFinite(serial)) return null
  const ms = EXCEL_EPOCH + Math.round(serial) * 86400000
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateCell(value: unknown): string | null {
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof value === 'number') return isoFromExcelSerial(value)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
    return isoFromBR(trimmed)
  }
  return null
}

function parseAmountCell(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return Number.isFinite(num) ? num : null
  }
  return null
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function downloadTransactionsExcel(transactions: Transaction[]): void {
  const rows = transactions.map(tx => ({
    [COLUMNS.id]: tx.id,
    [COLUMNS.type]: TYPE_LABEL[tx.type],
    [COLUMNS.amount]: tx.amount,
    [COLUMNS.competencia]: formatDateBR(tx.competencia),
    [COLUMNS.date]: formatDateBR(tx.date),
    [COLUMNS.description]: tx.description ?? '',
    [COLUMNS.category]: tx.type === 'expense' ? (tx.subcategory?.category?.name ?? '') : '',
    [COLUMNS.subcategory]: tx.type === 'expense' ? (tx.subcategory?.name ?? '') : '',
    [COLUMNS.paymentSource]: tx.payment_source?.name ?? '',
    [COLUMNS.incomeSource]: tx.type === 'income' ? (tx.income_source?.name ?? '') : '',
  }))

  const sheet = XLSX.utils.json_to_sheet(rows, { header: Object.values(COLUMNS) })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Lançamentos')

  const today = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `lancamentos-${today}.xlsx`)
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportLookups {
  categories: (Category & { subcategories: Subcategory[] })[]
  paymentSources: PaymentSource[]
  incomeSources: IncomeSource[]
}

export interface ImportRow {
  id?: string
  type: TransactionType
  amount: number
  description: string | null
  date: string
  competencia: string
  subcategory_id: string | null
  income_source_id: string | null
  payment_source_id: string | null
}

export interface ImportRowError {
  row: number
  message: string
}

export interface ImportParseResult {
  rows: ImportRow[]
  errors: ImportRowError[]
}

function buildLookupMaps(lookups: ImportLookups) {
  const subcategoryByKey = new Map<string, string>()
  for (const cat of lookups.categories) {
    for (const sub of cat.subcategories ?? []) {
      subcategoryByKey.set(`${cat.name.toLowerCase().trim()}::${sub.name.toLowerCase().trim()}`, sub.id)
    }
  }
  const paymentSourceByName = new Map(lookups.paymentSources.map(s => [s.name.toLowerCase().trim(), s.id]))
  const incomeSourceByName = new Map(lookups.incomeSources.map(s => [s.name.toLowerCase().trim(), s.id]))
  return { subcategoryByKey, paymentSourceByName, incomeSourceByName }
}

export async function parseTransactionsExcelFile(file: File, lookups: ImportLookups): Promise<ImportParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  const { subcategoryByKey, paymentSourceByName, incomeSourceByName } = buildLookupMaps(lookups)

  const rows: ImportRow[] = []
  const errors: ImportRowError[] = []

  records.forEach((record, idx) => {
    const rowNumber = idx + 2 // +1 for header row, +1 for 1-based indexing
    const id = cellText(record[COLUMNS.id]) || undefined

    const typeLabel = cellText(record[COLUMNS.type]).toLowerCase()
    const type: TransactionType | null =
      typeLabel === 'despesa' ? 'expense' : typeLabel === 'receita' ? 'income' : null
    if (!type) {
      errors.push({ row: rowNumber, message: `Tipo inválido: "${cellText(record[COLUMNS.type])}" (use "Despesa" ou "Receita")` })
      return
    }

    const amount = parseAmountCell(record[COLUMNS.amount])
    if (amount === null || amount <= 0) {
      errors.push({ row: rowNumber, message: 'Valor inválido ou ausente' })
      return
    }

    const competencia = parseDateCell(record[COLUMNS.competencia])
    if (!competencia) {
      errors.push({ row: rowNumber, message: 'Data de competência inválida ou ausente (use DD/MM/AAAA)' })
      return
    }

    const date = parseDateCell(record[COLUMNS.date])
    if (!date) {
      errors.push({ row: rowNumber, message: 'Data de pagamento inválida ou ausente (use DD/MM/AAAA)' })
      return
    }

    const description = cellText(record[COLUMNS.description]) || null

    let subcategory_id: string | null = null
    let income_source_id: string | null = null
    let payment_source_id: string | null = null

    const paymentSourceName = cellText(record[COLUMNS.paymentSource])
    if (paymentSourceName) {
      payment_source_id = paymentSourceByName.get(paymentSourceName.toLowerCase()) ?? null
      if (!payment_source_id) {
        errors.push({ row: rowNumber, message: `Fonte não encontrada: "${paymentSourceName}"` })
        return
      }
    }

    if (type === 'expense') {
      const categoryName = cellText(record[COLUMNS.category])
      const subcategoryName = cellText(record[COLUMNS.subcategory])
      if (!categoryName || !subcategoryName) {
        errors.push({ row: rowNumber, message: 'Categoria e Subcategoria são obrigatórias para despesas' })
        return
      }
      subcategory_id = subcategoryByKey.get(`${categoryName.toLowerCase().trim()}::${subcategoryName.toLowerCase().trim()}`) ?? null
      if (!subcategory_id) {
        errors.push({ row: rowNumber, message: `Subcategoria não encontrada: "${categoryName} > ${subcategoryName}"` })
        return
      }
      if (!payment_source_id) {
        errors.push({ row: rowNumber, message: 'Fonte é obrigatória para despesas' })
        return
      }
    } else {
      const incomeSourceName = cellText(record[COLUMNS.incomeSource])
      if (!incomeSourceName) {
        errors.push({ row: rowNumber, message: 'Origem da Receita é obrigatória para receitas' })
        return
      }
      income_source_id = incomeSourceByName.get(incomeSourceName.toLowerCase()) ?? null
      if (!income_source_id) {
        errors.push({ row: rowNumber, message: `Origem da Receita não encontrada: "${incomeSourceName}"` })
        return
      }
      if (!payment_source_id) {
        errors.push({ row: rowNumber, message: 'Fonte (conta de destino) é obrigatória para receitas' })
        return
      }
    }

    rows.push({ id, type, amount, description, date, competencia, subcategory_id, income_source_id, payment_source_id })
  })

  return { rows, errors }
}
