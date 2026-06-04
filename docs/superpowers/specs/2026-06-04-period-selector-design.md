# Seletor de Período — Design Spec
**Data:** 2026-06-04  
**Status:** Aprovado

## Objetivo

Permitir que o usuário visualize o dashboard agregado por mês único (comportamento atual), por intervalo contínuo de meses ou pelo ano inteiro — sem alterar a interface do modo mês.

---

## 1. Interface — `MonthSelector`

O componente passa a ter até três linhas:

```
Linha 1 (sempre visível):
  Modo Mês:      [< Fevereiro 2026 >]          [Comp/Caixa]
  Modo Intervalo: Fevereiro 2026 – Abril 2026   [Comp/Caixa]
  Modo Ano:      [< 2026 >]                     [Comp/Caixa]

Linha 2 (sempre visível):
        [Mês]   [Intervalo]   [Ano]      ← pill segmentado

Linha 3 (só em Intervalo):
        De [Fevereiro 2026 ▾]   Até [Abril 2026 ▾]
```

### Detalhes por modo

**Mês** — comportamento atual inalterado. Setas navegam mês a mês.

**Intervalo** — setas somem da linha 1; linha 1 exibe o label do intervalo ("Fevereiro 2026 – Abril 2026"). Linha 3 mostra dois `<select>` com todos os meses disponíveis em formato brasileiro (`getMonthYearLabel`). Se o usuário selecionar `Até` anterior ao `De`, o `Até` é ajustado para igual ao `De`.

**Ano** — setas navegam ano a ano. Linha 3 não aparece.

### Estilo

- Pill da linha 2: mesmo padrão visual do toggle Comp/Caixa existente (borda, fundo `bg-card`, item ativo `bg-foreground text-background`)
- `<select>` da linha 3: mesmo estilo dos filtros da página de Lançamentos (borda arredondada, `bg-card`)
- Datas exibidas sempre em português brasileiro via `getMonthYearLabel` (ex: "Março 2026")

---

## 2. Estado — `page.tsx`

Novos estados adicionados ao dashboard:

```typescript
const [periodMode, setPeriodMode] = useState<'month' | 'interval' | 'year'>('month')
const [startComp, setStartComp]   = useState(toCompetencia(new Date()))
const [endComp, setEndComp]       = useState(toCompetencia(new Date()))
const [year, setYear]             = useState(new Date().getFullYear())
```

Derivados (sem `useMemo`):

```typescript
const queryStart = periodMode === 'month'    ? competencia
                 : periodMode === 'year'     ? `${year}-01-01`
                 : startComp

const queryEnd   = periodMode === 'month'    ? competencia
                 : periodMode === 'year'     ? `${year}-12-01`
                 : endComp
```

Ao trocar de modo, o estado inicial herda o mês/ano atual — sem reset abrupto.

O bloco de **comparação com mês anterior** (`prevCompetencia`, `txPrev`) só é carregado e exibido em modo **Mês**.

---

## 3. Camada de dados

### `useDashboardTransactions(start, end, viewMode)`

Assinatura atual recebe um único `competencia`; passa a receber `start` e `end` (ambos `YYYY-MM-01`).

| viewMode | query |
|---|---|
| `competencia` | `gte('competencia', start).lte('competencia', end)` |
| `caixa` | `gte('date', start).lte('date', lastDayOf(end))` onde `lastDayOf('2026-04-01')` → `'2026-04-30'` via `new Date(y, m, 0)` |

### `useMonthlyEvolution(start, end, viewMode)`

Mesma lógica de range. O gráfico de evolução exibe **apenas os meses dentro do intervalo selecionado**.

### Compatibilidade com modo Mês

`start === end` produz exatamente o mesmo resultado da query `eq` anterior — sem risco de regressão.

---

## 4. Geração dos meses disponíveis nos `<select>`

Usar os últimos 24 meses a partir do mês atual (cobre 2 anos de histórico). Gerado com `addMonths` e `getMonthYearLabel` já existentes.

---

## 5. Props novas do `MonthSelector`

```typescript
interface Props {
  // existentes
  competencia: string
  viewMode: ViewMode
  onChangeCompetencia: (c: string) => void
  onToggleViewMode: () => void
  // novas
  periodMode: PeriodMode
  onChangePeriodMode: (m: PeriodMode) => void
  startComp: string
  endComp: string
  onChangeStartComp: (c: string) => void
  onChangeEndComp: (c: string) => void
  year: number
  onChangeYear: (y: number) => void
}
```

Label do intervalo quando `start === end`: exibe apenas o mês único ("Fevereiro 2026"), sem " – Fevereiro 2026" repetido.

---

## 6. Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/MonthSelector.tsx` | Adicionar `periodMode`, pill toggle, linha 3 com selects |
| `src/hooks/useTransactions.ts` | `useDashboardTransactions` e `useMonthlyEvolution` aceitam `start/end` |
| `src/app/(app)/page.tsx` | Novos estados, derivados `queryStart/queryEnd`, condicional mês anterior |
| `src/lib/types.ts` | Exportar `PeriodMode = 'month' \| 'interval' \| 'year'` |
