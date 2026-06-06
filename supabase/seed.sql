-- Finanças da Casa — Seed
-- Execute APÓS o schema.sql
-- Pode ser re-executado sem problema (truncate + re-insert)

truncate table transactions, subcategories, categories, payment_sources, income_sources restart identity cascade;

-- Categories
insert into categories (name, icon, color, sort_order) values
  ('Casa',        '🏠',  '#a78bfa', 1),
  ('Alimentação', '🍽️',  '#34d399', 2),
  ('Saúde',       '❤️',  '#f87171', 3),
  ('Presentes',   '🎁',  '#f472b6', 4),
  ('Lazer',       '🎉',  '#fb923c', 5);

-- Subcategories — Casa
insert into subcategories (name, category_id, sort_order)
select name, (select id from categories where name = 'Casa'), sort_order from (values
  ('Supermercado',  1),
  ('Mercadinho',    2),
  ('Empório',       3),
  ('Padaria',       4),
  ('Sacolão',       5),
  ('Diarista',      6),
  ('Utensílios',    7),
  ('Itens de Casa', 8)
) as t(name, sort_order);

-- Subcategories — Alimentação
insert into subcategories (name, category_id, sort_order)
select name, (select id from categories where name = 'Alimentação'), sort_order from (values
  ('Restaurantes e Bares', 1),
  ('Sobremesas',           2),
  ('Ifood',                3),
  ('Outros',               4)
) as t(name, sort_order);

-- Subcategories — Saúde
insert into subcategories (name, category_id, sort_order)
select name, (select id from categories where name = 'Saúde'), sort_order from (values
  ('Unimed',   1),
  ('Farmácia', 2),
  ('Dentista', 3),
  ('Outros',   4)
) as t(name, sort_order);

-- Subcategories — Presentes
insert into subcategories (name, category_id, sort_order)
select name, (select id from categories where name = 'Presentes'), sort_order from (values
  ('Aniversário', 1),
  ('Natal',       2),
  ('Páscoa',      3),
  ('Jack',        4),
  ('Outros',      5)
) as t(name, sort_order);

-- Subcategories — Lazer
insert into subcategories (name, category_id, sort_order)
select name, (select id from categories where name = 'Lazer'), sort_order from (values
  ('Lazer',     1),
  ('Presentes', 2),
  ('Outros',    3)
) as t(name, sort_order);

-- Category — Diversos
insert into categories (name, icon, color, sort_order) values
  ('Diversos', '📦', '#94a3b8', 6);

-- Subcategories — Diversos
insert into subcategories (name, category_id, sort_order)
select name, (select id from categories where name = 'Diversos'), sort_order from (values
  ('Presentes', 1),
  ('Outros',    2)
) as t(name, sort_order);

-- Payment sources
insert into payment_sources (name) values
  ('Nubank'),
  ('Itaú - Latam Cabelinho'),
  ('Diversos');

-- Income sources
insert into income_sources (name) values
  ('Gustavo'),
  ('Cabelinho'),
  ('Rendimentos Acumulados');
