# Design: Clonar lançamento, Importar/Exportar Excel, Conferência por data, fix do X duplicado

## Contexto

Quatro melhorias solicitadas para o app Finanças da Casa:

1. Permitir clonar um lançamento existente (abre formulário pré-preenchido para confirmar/ajustar e salvar como novo).
2. Permitir exportar todos os lançamentos para Excel e reimportar uma planilha (cria novos, atualiza existentes, nunca apaga).
3. Na Conferência de Extrato, manter o saldo da última atualização como padrão, mas permitir escolher uma data específica e ver o saldo acumulado e o histórico até aquela data.
4. Corrigir bug visual: dois ícones de "X" sobrepostos no formulário de edição de lançamento.

## 1. Clonar lançamento

### Componentes afetados
- `src/components/transaction/NewTransactionSheet.tsx`
- `src/app/(app)/lancamentos/page.tsx`

### Comportamento
- `NewTransactionSheet` recebe uma nova prop opcional `cloneFrom?: Transaction | null`, distinta de `editTransaction`.
  - Quando `cloneFrom` está presente (e `editTransaction` não), o formulário abre em **modo criação** (sem botão de excluir, botão de ação "Salvar"), mas todos os campos são pré-preenchidos com os valores de `cloneFrom` — tipo, valor, data de competência, data de pagamento, descrição, subcategoria/origem da receita, fonte/conta de destino — **exceto o `id`** (para que `handleSave` faça um `insert`, não `update`).
  - As datas pré-preenchidas são as **mesmas do lançamento original** (não a data de hoje).
- Botão "Clonar" (ícone `Copy` do lucide-react) no cabeçalho do formulário de edição, ao lado do botão de excluir. Ao clicar: fecha o sheet atual e reabre em modo clonagem com os dados copiados.
- Na lista de lançamentos (`SwipeableRow`), a área revelada ao deslizar para a esquerda passa a ter **dois botões lado a lado**: "Clonar" (ícone `Copy`) e "Excluir" (ícone `Trash2`, como já existe). A largura da área revelada (`DELETE_WIDTH`) dobra para acomodar os dois botões.

### Estado na página
`LancamentosPage` ganha um novo estado `cloneFromTx: Transaction | null`. A função `openClone(tx)` define `cloneFromTx = tx`, `editTx = null` e abre o sheet. `NewTransactionSheet` recebe tanto `editTransaction={editTx}` quanto `cloneFrom={cloneFromTx}` — apenas um dos dois estará preenchido por vez.

## 2. Importar / Exportar Excel

### Nova dependência
Adicionar `xlsx` (SheetJS) ao `package.json`. Biblioteca client-side, mantém o padrão do app de falar diretamente com o Supabase (sem rotas de API).

### Componentes/arquivos novos
- `src/lib/transactionsExcel.ts` — funções puras de export/parse (geração da planilha a partir de `Transaction[]`, e parsing/validação de linhas importadas para objetos prontos para upsert).
- `src/components/transaction/ImportExportControls.tsx` — botões "Exportar" / "Importar" + modal de resumo de importação.

### Exportar
- Botão "Exportar" no topo da aba Lançamentos (perto do contador "N itens").
- Busca **todos** os lançamentos (ignora os filtros aplicados na tela) e gera um arquivo `.xlsx` para download com as colunas:
  - `ID` (técnico, não editar — vazio em linhas novas)
  - `Tipo` (Despesa / Receita)
  - `Valor`
  - `Data Competência` (DD/MM/AAAA)
  - `Data Pagamento` (DD/MM/AAAA)
  - `Descrição`
  - `Categoria` / `Subcategoria` (nomes — preenchido só para despesas)
  - `Fonte` (nome da conta de pagamento)
  - `Origem da Receita` (nome — preenchido só para receitas)

### Importar
- Botão "Importar" abre seletor de arquivo `.xlsx`.
- Para cada linha:
  - Resolve `Subcategoria` → `subcategory_id` e `Fonte`/`Origem da Receita` → `payment_source_id`/`income_source_id`, comparando os nomes com os cadastros já carregados (`useCategories`, `usePaymentSources`, `useIncomeSources`).
  - Linha com `ID` preenchido e existente → `update` desse lançamento.
  - Linha sem `ID` → `insert` como novo lançamento.
  - Valida campos obrigatórios (valor > 0, datas válidas, descrição, subcategoria/fonte ou origem/conta de destino conforme o tipo). Linha inválida é **pulada** (não interrompe o processamento das demais) e registrada na lista de erros com o motivo.
  - Lançamentos existentes que não aparecem na planilha **não são alterados nem apagados**.
- Ao final, exibe um modal de resumo: "X criados, Y atualizados, Z com erro", com lista detalhada das linhas com erro (número da linha + motivo) para o usuário corrigir e reimportar.
- Novo hook `useImportTransactions` em `useTransactions.ts`, que recebe a lista de linhas já resolvidas e faz os upserts em lote via Supabase, retornando o resumo (criados/atualizados/erros) e invalidando as queries relevantes (`transactions`, `dashboard`, `monthly-evolution`, `year-transactions`).

## 3. Conferência de Extrato — saldo em data específica

### Componente afetado
`Conferencia` / `SourceCard` em `src/app/(app)/relatorios/page.tsx`

### Comportamento
- Dentro do card de cada fonte de pagamento, o seletor atual "Período: Todo o histórico / [meses]" é **substituído** por um seletor de data específica (`<input type="date">`), rotulado "Ver saldo em:".
- **Padrão** (nenhuma data selecionada): comportamento atual mantido — saldo total da conta, lista completa de lançamentos, rótulo "Última atualização: [data]".
- **Com data selecionada**:
  - O saldo exibido no cabeçalho do card passa a ser o **acumulado até a data escolhida** — soma de receitas menos despesas com `date <= data escolhida`.
  - A lista de lançamentos do card mostra **todos os lançamentos com `date <= data escolhida`** (histórico até aquele dia), ordenados como hoje.
  - Um botão "Limpar" ao lado do seletor remove a data e volta ao padrão.
- A prop `filterMonth`/`months` do `SourceCard` é substituída por `selectedDate: string` e `onDateChange: (v: string) => void`; o cálculo de `balance`/`lastDate` passados de `Conferencia` para `SourceCard` permanece o mesmo (saldo total = padrão), e o `SourceCard` recalcula localmente o saldo "até a data" via `useMemo` quando `selectedDate` está preenchido.

## 4. Fix: X duplicado no formulário de edição

### Componente afetado
`src/components/transaction/NewTransactionSheet.tsx`

### Causa
`SheetContent` (em `src/components/ui/sheet.tsx`) já renderiza automaticamente um botão de fechar (`XIcon`) no canto superior direito (`showCloseButton` tem padrão `true`). `NewTransactionSheet` também renderiza seu próprio botão `<X>` customizado no `SheetHeader`, resultando em dois ícones sobrepostos.

### Correção
Passar `showCloseButton={false}` para `<SheetContent>` em `NewTransactionSheet`, removendo o botão automático e mantendo apenas o botão customizado do cabeçalho (que já convive corretamente com o botão de excluir). Mesmo padrão já usado em `src/app/(app)/cadastros/page.tsx`.
