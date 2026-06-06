# Do zero ao app no ar — guia de referência

> Este guia registra o fluxo completo usado no projeto Finanças da Casa.
> Use como referência para replicar em qualquer projeto futuro.

---

## O mapa geral

Antes de entrar em cada ferramenta, entenda o papel de cada uma:

| Ferramenta | O que é | Por que existe no fluxo |
|---|---|---|
| **PRD** | Documento de planejamento | Define o que construir antes de escrever código |
| **Next.js** | Framework do app | É o app em si — páginas, rotas, lógica |
| **Supabase** | Banco de dados na nuvem | Armazena os dados e cuida do login |
| **GitHub** | Repositório de código | Salva o histórico do código e conecta tudo |
| **Cursor / Claude Code** | Editor com IA | Onde o código é escrito e evoluído |
| **Vercel** | Hospedagem | Publica o app na internet |

O fluxo entre elas é linear:

```
Ideia → PRD → Código (Cursor) → GitHub → Vercel (deploy automático)
                                    ↑
                               Supabase (banco)
```

---

## Fase 1 — Planejamento (PRD)

**O que é:** PRD = Product Requirements Document. Uma conversa estruturada para definir o produto antes de codar.

**Por que fazer:** Evita construir a coisa errada. 30 minutos de PRD economizam dias de retrabalho.

**Como fazer:** Responda pelo menos estas perguntas:
- Qual problema resolve? (ou qual oportunidade aproveita?)
- Quem vai usar? (usuário único, casal, empresa?)
- Quais são as 3 telas principais?
- Qual é o dado mais importante que o app precisa guardar?
- Mobile, desktop ou os dois?

**Resultado esperado:** Um documento com decisões registradas. Não precisa ser formal — pode ser uma conversa com a IA que gera o documento no final.

---

## Fase 2 — Criação do projeto

### 2.1 Criar o app Next.js

```bash
npx create-next-app@latest nome-do-projeto
```

Opções recomendadas na criação:
- TypeScript: **Sim**
- Tailwind CSS: **Sim**
- App Router: **Sim**
- `src/` directory: **Sim**

### 2.2 Instalar dependências do projeto

```bash
# Supabase (banco de dados)
npm install @supabase/supabase-js @supabase/ssr

# TanStack Query (gerenciamento de dados)
npm install @tanstack/react-query

# shadcn/ui (componentes prontos)
npx shadcn@latest init

# Ícones
npm install lucide-react

# Gráficos (se precisar)
npm install recharts
```

### 2.3 Estrutura de pastas recomendada

```
src/
  app/
    (app)/          ← rotas autenticadas
      page.tsx      ← dashboard / tela principal
    login/
      page.tsx
  components/
    dashboard/      ← componentes da tela principal
    ui/             ← componentes genéricos (shadcn)
  hooks/            ← useTransactions, useCategories, etc.
  lib/
    supabase/
      client.ts     ← cliente para uso no browser
      server.ts     ← cliente para uso no servidor
    types.ts        ← tipos TypeScript do projeto
  proxy.ts          ← middleware de autenticação (Next.js 16+)
```

---

## Fase 3 — Supabase (banco de dados)

### 3.1 Criar o projeto

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Escolha nome, senha e região (South America - São Paulo)
3. Aguarde o projeto inicializar (~2 min)

### 3.2 Criar as tabelas

No Supabase Dashboard → **SQL Editor** → cole e execute o `schema.sql` do projeto.

O schema define:
- As tabelas (transactions, categories, etc.)
- Os índices de performance
- As políticas de segurança (RLS — Row Level Security)

**RLS é obrigatório:** sem ele, qualquer pessoa com a chave pública do banco acessa todos os dados.

### 3.3 Popular dados iniciais

Cole e execute o `seed.sql` — insere categorias, fontes de pagamento e receita.

### 3.4 Criar o usuário

**Authentication → Users → Add user** → crie o email e senha que você vai usar para logar.

### 3.5 Pegar as credenciais

**Project Settings → API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.6 Criar o `.env.local`

Na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxx
```

> **Segurança:** o prefixo `NEXT_PUBLIC_` expõe a variável ao browser — isso é intencional para a chave anon do Supabase, que é projetada para ser pública. A segurança real vem do RLS no banco. Nunca use `NEXT_PUBLIC_` para chaves secretas (service role key, tokens de API externos, etc.).

---

## Fase 4 — GitHub

### 4.1 Criar o repositório

1. Acesse [github.com](https://github.com) → **New repository**
2. Nome do repo, privado ou público, **sem** README (o projeto já tem arquivos)
3. Copie a URL do repositório (ex: `https://github.com/usuario/repo.git`)

### 4.2 Conectar o projeto local ao GitHub

```bash
git init                          # se ainda não for um repo git
git remote add origin URL_DO_REPO
git branch -M main
git push -u origin main
```

### 4.3 O fluxo de commits

A cada alteração de código:

```bash
git add arquivo1 arquivo2         # ou: git add .
git commit -m "feat: descrição"
git push origin main
```

**Prefixos de commit recomendados (Conventional Commits):**
- `feat:` → nova funcionalidade
- `fix:` → correção de bug
- `refactor:` → melhoria de código sem mudar comportamento
- `chore:` → manutenção (configs, deps)
- `docs:` → documentação

### 4.4 O que NUNCA commitar

O `.gitignore` deve bloquear:
```
.env*           ← credenciais
node_modules/   ← dependências (pesadas, regeneráveis)
.next/          ← build gerado automaticamente
```

---

## Fase 5 — Deploy no Vercel

### 5.1 Conectar o repositório

1. Acesse [vercel.com](https://vercel.com) → login com GitHub
2. **Add New → Project** → selecione o repositório
3. Vercel detecta Next.js automaticamente — não precisa configurar build

### 5.2 Adicionar variáveis de ambiente

Antes de clicar em Deploy, expanda **Environment Variables** e adicione as mesmas variáveis do `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL       = sua URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  = sua chave
```

### 5.3 Deploy e deploys automáticos

- Clique em **Deploy** — o app vai ao ar em ~2 minutos
- **A partir daí: todo `git push origin main` gera um novo deploy automaticamente**

Ou seja: você faz push do código → Vercel percebe → reconstrói e publica sozinho.

---

## O fluxo completo em resumo

```
1. PRD            → define o que construir
2. create-next-app → cria a estrutura
3. Supabase       → cria banco, schema, seed, usuário, copia credenciais
4. .env.local     → cola as credenciais localmente
5. GitHub         → cria repo, faz push inicial
6. Vercel         → importa repo, adiciona env vars, deploy
7. Desenvolvimento → código → commit → push → Vercel publica automaticamente
```

---

## Checklist para novos projetos

- [ ] PRD respondido (problema, usuário, telas, dados, plataforma)
- [ ] `create-next-app` rodado com TypeScript + Tailwind + App Router
- [ ] Dependências instaladas
- [ ] Projeto criado no Supabase
- [ ] `schema.sql` executado no SQL Editor
- [ ] `seed.sql` executado (se houver dados iniciais)
- [ ] Usuário criado no Supabase Authentication
- [ ] `.env.local` criado com URL e anon key
- [ ] `.env.local` está no `.gitignore` (padrão do Next.js — já vem configurado)
- [ ] Repositório criado no GitHub
- [ ] Código conectado ao GitHub (`git remote add origin`)
- [ ] Push inicial feito
- [ ] Projeto importado no Vercel
- [ ] Variáveis de ambiente adicionadas no Vercel
- [ ] Deploy feito e URL testada
