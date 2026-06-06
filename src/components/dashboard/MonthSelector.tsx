'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, getMonthYearLabel, toCompetencia } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { ViewMode, PeriodMode } from '@/lib/types'

const MONTHS_AVAILABLE = 24

function buildMonthOptions() {
  const now = new Date()
  return Array.from({ length: MONTHS_AVAILABLE }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = toCompetencia(d)
    return { value, label: getMonthYearLabel(value) }
  })
}

interface Props {
  competencia: string
  viewMode: ViewMode
  onChangeCompetencia: (c: string) => void
  onToggleViewMode: () => void
  periodMode: PeriodMode
  onChangePeriodMode: (m: PeriodMode) => void
  startComp: string
  endComp: string
  onChangeStartComp: (c: string) => void
  onChangeEndComp: (c: string) => void
  year: number
  onChangeYear: (y: number) => void
}

const PERIOD_LABELS: Record<PeriodMode, string> = {
  month: 'Mês',
  interval: 'Intervalo',
  year: 'Ano',
}

export function MonthSelector({
  competencia, viewMode, onChangeCompetencia, onToggleViewMode,
  periodMode, onChangePeriodMode,
  startComp, endComp, onChangeStartComp, onChangeEndComp,
  year, onChangeYear,
}: Props) {
  const monthOptions = buildMonthOptions()

  function handleStartChange(val: string) {
    onChangeStartComp(val)
    if (val > endComp) onChangeEndComp(val)
  }

  function handleEndChange(val: string) {
    onChangeEndComp(val)
    if (val < startComp) onChangeStartComp(val)
  }

  const intervalLabel = startComp === endComp
    ? getMonthYearLabel(startComp)
    : `${getMonthYearLabel(startComp)} – ${getMonthYearLabel(endComp)}`

  return (
    <div className="mb-5 flex flex-col gap-2">
      {/* Linha 1: navegação + viewMode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {periodMode === 'month' && (
            <>
              <button
                onClick={() => onChangeCompetencia(addMonths(competencia, -1))}
                className="p-1.5 rounded-lg hover:bg-border/40 text-muted-foreground transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
                {getMonthYearLabel(competencia)}
              </span>
              <button
                onClick={() => onChangeCompetencia(addMonths(competencia, 1))}
                className="p-1.5 rounded-lg hover:bg-border/40 text-muted-foreground transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          {periodMode === 'interval' && (
            <span className="text-sm font-medium text-foreground px-1.5">
              {intervalLabel}
            </span>
          )}
          {periodMode === 'year' && (
            <>
              <button
                onClick={() => onChangeYear(year - 1)}
                className="p-1.5 rounded-lg hover:bg-border/40 text-muted-foreground transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-foreground min-w-[60px] text-center">
                {year}
              </span>
              <button
                onClick={() => onChangeYear(year + 1)}
                className="p-1.5 rounded-lg hover:bg-border/40 text-muted-foreground transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center bg-border/30 rounded-full p-0.5 gap-0.5">
          {(['competencia', 'caixa'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => viewMode !== mode && onToggleViewMode()}
              className={cn(
                'text-xs px-3 py-1 rounded-full transition-colors font-medium',
                viewMode === mode
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {mode === 'competencia' ? 'Competência' : 'Caixa'}
            </button>
          ))}
        </div>
      </div>

      {/* Linha 2: pill Mês / Intervalo / Ano */}
      <div className="flex justify-center">
        <div className="flex items-center bg-border/30 rounded-full p-0.5 gap-0.5">
          {(['month', 'interval', 'year'] as PeriodMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onChangePeriodMode(mode)}
              className={cn(
                'text-xs px-3 py-1 rounded-full transition-colors font-medium',
                periodMode === mode
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {PERIOD_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* Linha 3: seletores De / Até (só em Intervalo) */}
      {periodMode === 'interval' && (
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">De</span>
            <select
              value={startComp}
              onChange={e => handleStartChange(e.target.value)}
              className="text-sm border border-border rounded-full px-3 py-1.5 bg-card cursor-pointer outline-none text-foreground"
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Até</span>
            <select
              value={endComp}
              onChange={e => handleEndChange(e.target.value)}
              className="text-sm border border-border rounded-full px-3 py-1.5 bg-card cursor-pointer outline-none text-foreground"
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
