-- Finanças da Casa — Schema
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Categories
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text not null default '📌',
  color       text not null default '#94a3b8',
  sort_order  integer not null default 99,
  created_at  timestamptz default now()
);

-- Subcategories
create table if not exists subcategories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category_id uuid not null references categories(id) on delete cascade,
  sort_order  integer not null default 99,
  created_at  timestamptz default now()
);

-- Payment sources
create table if not exists payment_sources (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

-- Income sources
create table if not exists income_sources (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

-- Transactions
create table if not exists transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  type              text not null check (type in ('expense', 'income')),
  amount            numeric(12, 2) not null check (amount > 0),
  description       text,
  date              date not null,
  competencia       date not null,
  subcategory_id    uuid references subcategories(id) on delete set null,
  income_source_id  uuid references income_sources(id) on delete set null,
  payment_source_id uuid references payment_sources(id) on delete set null,
  created_at        timestamptz default now()
);

-- Indexes
create index if not exists idx_transactions_user_competencia on transactions(user_id, competencia);
create index if not exists idx_transactions_user_date on transactions(user_id, date);
create index if not exists idx_transactions_user_type on transactions(user_id, type);
create index if not exists idx_subcategories_category on subcategories(category_id);

-- Row Level Security
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table payment_sources enable row level security;
alter table income_sources enable row level security;
alter table transactions enable row level security;

-- Public read for lookup tables (single-user app — all users see same categories)
create policy "public read categories" on categories for select using (true);
create policy "public read subcategories" on subcategories for select using (true);
create policy "public read payment_sources" on payment_sources for select using (true);
create policy "public read income_sources" on income_sources for select using (true);

-- Authenticated write for lookup tables
create policy "auth write categories" on categories for all using (auth.role() = 'authenticated');
create policy "auth write subcategories" on subcategories for all using (auth.role() = 'authenticated');
create policy "auth write payment_sources" on payment_sources for all using (auth.role() = 'authenticated');
create policy "auth write income_sources" on income_sources for all using (auth.role() = 'authenticated');

-- Transactions: owner only
create policy "owner transactions" on transactions for all using (auth.uid() = user_id);
