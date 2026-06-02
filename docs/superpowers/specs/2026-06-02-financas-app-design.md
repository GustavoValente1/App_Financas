# Design Spec — Finanças Relacionamento App
**Data:** 2026-06-02

---

## 1. Visão Geral

App web pessoal de controle financeiro para casal. Usuário único (o dono). Foco duplo: lançar despesas em tempo real pelo celular (rápido, 2 toques) e visualizar os dados com gráficos e análises que hoje não existem na planilha atual.

PWA responsivo: mesmo código para mobile e desktop. Dados e auth no Supabase, garantindo sincronização entre dispositivos.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS + shadcn/ui |
| Dados | Supabase (PostgreSQL + Auth) |
| Estado/cache | TanStack Query (React Query v5) |
| Deploy | Vercel |
| Gráficos | Recharts |

---

## 3. Arquitetura

Next.js serve um shell estático. Toda a lógica de dados é client-side via Supabase JS + TanStack Query. Sem Server Components para data fetching (app privado, sem necessidade de SEO). Middleware Next.js protege todas as rotas autenticadas.

---

## 4. Modelo de Dados

```sql
-- Autenticação gerenciada pelo Supabase Auth (tabela auth.users)

profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users,
  email       text
)

categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,       -- 'Casa', 'Alimentação', etc.
  icon        text,                -- emoji ou nome de ícone
  color       text,                -- hex color
  sort_order  integer
)

subcategories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category_id uuid REFERENCES categories,
  sort_order  integer
)

payment_sources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL        -- 'Nubank', 'Itaú - Latam Cabelinho', 'Diversos'
)

income_sources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL        -- 'Gustavo', 'Cabelinho', 'Rendimentos Acumulados'
)

transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users NOT NULL,
  type              text NOT NULL CHECK (type IN ('expense', 'income')),
  amount            numeric(12,2) NOT NULL,
  description       text,
  date              date NOT NULL,          -- data real da transação
  competencia       date NOT NULL,          -- primeiro dia do mês de competência
  subcategory_id    uuid REFERENCES subcategories,    -- só despesas
  income_source_id  uuid REFERENCES income_sources,   -- só receitas
  payment_source_id uuid REFERENCES payment_sources,  -- só despesas
  created_at        timestamptz DEFAULT now()
)
```

**Regra de negócio principal:** o dashboard filtra por `competencia` por padrão. O toggle Competência/Caixa alterna para filtrar por `date`.

**RLS (Row Level Security):** ativado. Todas as queries filtram `user_id = auth.uid()`.

---

## 5. Seed de Dados Iniciais

### Categorias e subcategorias
- **Casa** (roxo `#a78bfa`): Supermercado, Mercadinho, Empório, Padaria, Sacolão, Diarista, Utensílios, Itens de Casa
- **Alimentação** (verde `#34d399`): Restaurantes e Bares, Sobremesas, Ifood, Outros
- **Saúde** (coral `#f87171`): Unimed, Farmácia, Dentista, Outros
- **Presentes** (rosa `#f472b6`): Aniversário, Natal, Páscoa, Jack, Outros
- **Lazer** (laranja `#fb923c`): Lazer, Presentes, Outros

### Fontes de pagamento
- Nubank
- Itaú - Latam Cabelinho *(padrão no lançamento)*
- Diversos

### Origens de receita
- Gustavo
- Cabelinho
- Rendimentos Acumulados

---

## 6. Telas

### 6.1 Dashboard

Layout em rolagem vertical. Fundo bege creme `#f5f0e8`.

**Elementos (de cima para baixo):**
1. Header: "Finanças da Casa" + seletor de mês (← Junho 2026 →) + badge toggle Competência/Caixa
2. **Card herói** (branco): label "Gasto no mês" + valor em destaque (Inter 500, ~40px) + badge de comparação vs mês anterior (↑/↓ X%)
3. Dois cards menores lado a lado: Receita (valor em verde) e Saldo (verde se positivo, vermelho se negativo) — cada um com variação % vs mês anterior
4. Seção "Pra onde foi": lista de categorias com ícone, nome, valor e barra de proporção colorida
5. Card "Evolução mensal": gráfico de barras (Recharts) mês a mês, mês atual em roxo escuro
6. Card "Composição do mês": gráfico donut (Recharts) por categoria com legenda
7. Card "Maiores gastos": top 5 lançamentos do mês com número, descrição e valor

**Fixo na base:** botão preto "+ Novo lançamento" (abre bottom sheet)

### 6.2 Bottom Sheet — Novo Lançamento

Painel que sobe por cima do dashboard. Fecha com swipe para baixo ou botão ×.

**Toggle no topo:** Despesa | Receita

**Modo Despesa:**
- Grid de subcategorias (todas visíveis, agrupadas por categoria, ordenadas por categoria e alfabeticamente)
- Campo de valor (teclado numérico)
- Botão "Salvar"
- Pré-preenchido automaticamente: `date = hoje`, `competencia = 1º do mês atual`, `payment_source = Itaú - Latam Cabelinho`
- Seção expansível "+ mais opções": descrição, fonte diferente, data retroativa, competência diferente

**Modo Receita:**
- Lista de origens de receita (Gustavo, Cabelinho, Rendimentos Acumulados)
- Campo de valor
- Botão "Salvar"
- Mesma lógica de data/competência automáticas

### 6.3 Lançamentos

- Header: "Lançamentos" + contagem total
- Barra de busca por descrição (debounced)
- Chips de filtro empilháveis: Mês, Categoria, Fonte, "+ Mais" (faixa de valor, subcategoria)
- Linha de resultado quando filtro ativo: "Resultado filtrado: R$ X.XXX,XX"
- Lista de transações: ícone de categoria, descrição, "Categoria · Subcategoria · DD/MM" (ou "Origem · DD/MM" para receitas), valor
- Toque em item: abre o mesmo bottom sheet pré-preenchido para edição + opção de excluir (confirmação antes de deletar)

### 6.4 Cadastros

3 abas: **Categorias**, **Fontes**, **Receitas**

- **Categorias**: cada categoria é linha expansível com ícone colorido, nome, contagem de subcategorias. Expandida: chips de subcategorias + botão "+ add". Toque em subcategoria abre modal de edição/exclusão.
- **Fontes** e **Receitas**: listas simples com editar/excluir inline e botão "+ Nova" no rodapé.

---

## 7. Layout Responsivo

| Breakpoint | Layout |
|---|---|
| Mobile (< 768px) | Barra de navegação inferior com 3 itens: Dashboard, Lançamentos, Cadastros |
| Desktop (≥ 768px) | Sidebar fixa à esquerda (240px) + conteúdo centralizado (max-width 480px) |

No desktop, o bottom sheet de novo lançamento aparece como modal centralizado.

---

## 8. Design System

**Cores:**
- Fundo: `#f5f0e8`
- Cards: `#ffffff`
- Texto principal: `#1a1a1a`
- Texto secundário: `#888888`
- Casa: `#a78bfa` | Alimentação: `#34d399` | Saúde: `#f87171` | Presentes: `#f472b6` | Lazer: `#fb923c`
- Positivo: `#16a34a` | Negativo: `#dc2626`

**Dark mode:** fundo `#1a1a1a`, cards `#262626`, texto principal `#f5f5f5`

**Tipografia:** Inter (Google Fonts), pesos 400 e 500 apenas.

**Referências visuais:** Nubank (número em destaque), Linear (limpeza e tipografia), Organizze (organização de finanças pessoais).

---

## 9. Autenticação

- Supabase Auth com email + senha
- Conta criada diretamente no Supabase Dashboard (sem tela de cadastro público no app)
- Tela de login simples (logo + email + senha + botão entrar)
- Middleware Next.js redireciona `/` → `/login` se não autenticado

---

## 10. Fora do Escopo (MVP)

- Multi-usuário / compartilhamento
- Exportação de dados (CSV/PDF)
- Integração com bancos / Open Finance
- Notificações push
- Parte premium / pagamento
- Orçamentos / metas por categoria
