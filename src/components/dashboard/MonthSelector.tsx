'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, getMonthYearLabel } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/lib/types'

interface Props {
  competencia: string
  viewMode: ViewMode
  onChangeCompetencia: (c: string) => void
  onToggleViewMode: () => void
}

export function MonthSelector({ competencia, viewMode, onChangeCompetencia, onToggleViewMode }: Props) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChangeCompetencia(addMonths(competencia, -1))}
          className="p-1.5 rounded-lg hover:bg-border/40 text-muted-foreground transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-foreground min-w-[130px] text-center">
          {getMonthYearLabel(competencia)}
        </span>
        <button
          onClick={() => onChangeCompetencia(addMonths(competencia, 1))}
          className="p-1.5 rounded-lg hover:bg-border/40 text-muted-foreground transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <button
        onClick={onToggleViewMode}
        className={cn(
          'text-xs px-3 py-1.5 rounded-full border transition-colors font-medium',
          viewMode === 'competencia'
            ? 'bg-foreground text-background border-transparent'
            : 'bg-card text-muted-foreground border-border'
        )}
      >
        {viewMode === 'competencia' ? 'Competência' : 'Caixa'}
      </button>
    </div>
  )
}
