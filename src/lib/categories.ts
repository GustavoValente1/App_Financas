export const CATEGORY_COLORS: Record<string, string> = {
  'Casa': '#a78bfa',
  'Alimentação': '#34d399',
  'Saúde': '#f87171',
  'Presentes': '#f472b6',
  'Lazer': '#fb923c',
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Casa': '🏠',
  'Alimentação': '🍽️',
  'Saúde': '❤️',
  'Presentes': '🎁',
  'Lazer': '🎉',
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? '#94a3b8'
}

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? '📌'
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  return formatCurrency(value)
}

export function getMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
    .replace(/^\w/, c => c.toUpperCase())
}

export function getMonthYearLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

export function toCompetencia(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

export function addMonths(competencia: string, n: number): string {
  const [y, m] = competencia.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return toCompetencia(d)
}
