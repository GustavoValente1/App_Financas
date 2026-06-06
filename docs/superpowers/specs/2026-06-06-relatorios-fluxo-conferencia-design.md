# Relatórios: Fluxo de Caixa e Conferência de Extrato

**Data:** 2026-06-06  
**Status:** Aprovado

---

## Contexto

O app atualmente tem 3 abas: Dashboard, Lançamentos, Cadastros. Este spec adiciona uma 4ª aba — **Relatórios** — com dois sub-recursos:

1. **Fluxo de Caixa** — tabela anual estilo planilha com toggle Competência/Caixa
2. **Conferência de Extrato** — saldo atual por fonte de pagamento para reconciliação bancária

---

## 1. Mudança de dados — receitas passam a ter "Conta"

### Problema
O campo `payment_source_id` já existe na tabela `transactions` mas só é usado em despesas. Para calcular saldo por conta bancária, receitas também precisam informar em qual conta o dinheiro chegou.

### Solução
- **Nenhuma mudança de schema** — `payment_source_id` já é nullable na tabela
- **`NewTransactionSheet`**: adicionar campo "Conta de destino" no formulário de receitas, usando o mesmo Select de fontes das despesas
- Campo fica após "Descrição", não é obrigatório (para não quebrar o fluxo rápido de entrada)
- **Receitas existentes sem fonte**: após implementação, identificar transações de receita com `payment_source_id = null` e atualizar via SQL com base na confirmação do usuário

---

## 2. Navegação

### Mudança
Nav mobile (BottomNav) e sidebar desktop passam de 3 para 4 itens:

```
[Dashboard]  [Lançamentos]  [Relatórios]  [Cadastros]
```

- Ícone: `BarChart2` (lucide-react)  
- Rota: `/relatorios`  
- Internamente: sub-tabs via componente `Tabs` (shadcn)

---

## 3. Fluxo de Caixa

### Rota
`/relatorios` → sub-tab "Fluxo de Caixa" (padrão)

### Controles
- **Seletor de ano**: botões ◄/► navegam ano a ano, exibição central "2026"
- **Toggle modo**: Competência | Caixa (mesmo estilo visual do toggle Despesa/Receita)
  - Competência: agrupa pelo campo `competencia` da transação
  - Caixa: agrupa pelo campo `date` da transação

### Tabela
Scroll horizontal no mobile (container `overflow-x-auto`, tabela `min-w-[900px]`).

**Colunas:** Descrição · Jan · Fev · Mar · Abr · Mai · Jun · Jul · Ago · Set · Out · Nov · Dez · Total  
**14 colunas no total.**

**Linhas (em ordem):**
1. Uma linha por fonte de receita que teve transações no ano (ex: Gustavo, Cabelinho, Rendimentos Acumulados)
2. **Receitas Total** — soma de todas as receitas por mês — bold, fundo azul claro, texto azul
3. *(linha separadora vazia)*
4. Uma linha por categoria de despesa que teve transações no ano (ex: Casa, Alimentação, Saúde…)
5. **Despesas Total** — soma de todas as despesas por mês — bold, fundo vermelho claro, texto vermelho
6. **Saldo** — Receitas Total − Despesas Total por mês — bold, fundo cinza, valores negativos em vermelho
7. **Saldo acumulado** — soma corrida do Saldo mês a mês; para meses sem dados, propaga o último valor calculado

**Formatação de células:**
- Valor 0 ou sem dados: exibe "–"
- Valores numéricos: `toLocaleString('pt-BR', { minimumFractionDigits: 2 })` sem símbolo R$
- Valores negativos no Saldo: texto vermelho

### Hook de dados
Novo `useYearTransactions(year: number, viewMode: ViewMode)` em `useTransactions.ts`:
- Modo Competência: `gte('competencia', YYYY-01-01).lte('competencia', YYYY-12-31)`
- Modo Caixa: `gte('date', YYYY-01-01).lte('date', YYYY-12-31)`
- Select completo com subcategory → category, income_source, payment_source

### Processamento client-side
A agregação é feita no cliente via `useMemo`:
- Inicializa mapas com todas as fontes de receita e categorias do DB (ordem definida pelo `sort_order`)
- Itera transações e acumula por mês (índice 0–11)
- Filtra linhas com todos os valores zerados (não exibe linhas vazias)

---

## 4. Conferência de Extrato

### Rota
`/relatorios` → sub-tab "Conferência"

### Comportamento geral
Mostra o **saldo atual acumulado** por fonte de pagamento (sem filtro de período por padrão), usando o campo `date` (caixa) como referência.

**Saldo por fonte** = Σ receitas com `payment_source_id = X` − Σ despesas com `payment_source_id = X`  
**Última atualização** = MAX(`date`) das transações com `payment_source_id = X`

### Layout
**Filtro de período (opcional):** select de mês no topo. Quando vazio = saldo de todo o histórico (padrão). Quando preenchido = exibe apenas transações daquele mês na lista expandida (mas o saldo do card continua sendo o acumulado total).

> **Nota de UX**: o saldo do card é sempre all-time (saldo real da conta). O filtro de período afeta apenas o que aparece na lista expandida, para facilitar a conferência de um extrato mensal específico.

**Card por fonte:**
```
┌──────────────────────────────────────────┐
│ Nubank                               ▼   │
│ Saldo: R$ 1.234,56                        │
│ Última atualização: 05/06/2026            │
└──────────────────────────────────────────┘
```

**Expandido (lista de transações):**
- Ordenadas por `date` crescente (estilo extrato bancário)
- Cada linha: `DD/MM/AAAA · descrição · categoria/subcategoria · valor`
- Entradas (receita): valor em verde com prefixo `+`
- Saídas (despesa): valor normal sem prefixo

**Alerta de dados incompletos:** se existirem receitas sem `payment_source_id`, exibir um aviso no topo da aba: "X receita(s) sem conta atribuída — edite-as para incluir no saldo."

### Hook de dados
Reusar `useTransactions` sem filtro de período para buscar todas as transações. Processamento via `useMemo` no cliente:
- Agrupar por `payment_source_id`
- Calcular saldo e data mais recente por grupo
- Exibir fontes com pelo menos uma transação; fontes sem transações ficam ocultas

---

## 5. Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/hooks/useTransactions.ts` | Adicionar `useYearTransactions` |
| `src/app/(app)/relatorios/page.tsx` | Criar — página principal com sub-tabs |
| `src/components/nav/BottomNav.tsx` | Adicionar item Relatórios |
| `src/components/nav/Sidebar.tsx` | Adicionar item Relatórios |
| `src/components/transaction/NewTransactionSheet.tsx` | Adicionar campo "Conta de destino" para receitas |

---

## 6. Fora de escopo

- Saldo inicial configurável por conta (sempre começa do zero)
- Export para PDF/Excel
- Gráfico de evolução do saldo na Conferência
- Categorização automática de receitas sem fonte

---

## 7. Pós-implementação — receitas existentes sem fonte

Após deploy, executar query para identificar receitas sem `payment_source_id`:
```sql
SELECT id, description, amount, date, income_source_id
FROM transactions
WHERE type = 'income' AND payment_source_id IS NULL
ORDER BY date DESC;
```
Confirmar com o usuário a qual fonte cada uma pertence e executar os UPDATEs correspondentes.
