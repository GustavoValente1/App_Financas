-- Finanças da Casa — Seed
-- Execute APÓS o schema.sql

-- Categories
insert into categories (id, name, icon, color, sort_order) values
  ('cat-casa',        'Casa',        '🏠',  '#a78bfa', 1),
  ('cat-alimentacao', 'Alimentação', '🍽️',  '#34d399', 2),
  ('cat-saude',       'Saúde',       '❤️',  '#f87171', 3),
  ('cat-presentes',   'Presentes',   '🎁',  '#f472b6', 4),
  ('cat-lazer',       'Lazer',       '🎉',  '#fb923c', 5)
on conflict (id) do nothing;

-- Subcategories — Casa
insert into subcategories (name, category_id, sort_order) values
  ('Supermercado',  'cat-casa', 1),
  ('Mercadinho',    'cat-casa', 2),
  ('Empório',       'cat-casa', 3),
  ('Padaria',       'cat-casa', 4),
  ('Sacolão',       'cat-casa', 5),
  ('Diarista',      'cat-casa', 6),
  ('Utensílios',    'cat-casa', 7),
  ('Itens de Casa', 'cat-casa', 8)
on conflict do nothing;

-- Subcategories — Alimentação
insert into subcategories (name, category_id, sort_order) values
  ('Restaurantes e Bares', 'cat-alimentacao', 1),
  ('Sobremesas',           'cat-alimentacao', 2),
  ('Ifood',                'cat-alimentacao', 3),
  ('Outros',               'cat-alimentacao', 4)
on conflict do nothing;

-- Subcategories — Saúde
insert into subcategories (name, category_id, sort_order) values
  ('Unimed',    'cat-saude', 1),
  ('Farmácia',  'cat-saude', 2),
  ('Dentista',  'cat-saude', 3),
  ('Outros',    'cat-saude', 4)
on conflict do nothing;

-- Subcategories — Presentes
insert into subcategories (name, category_id, sort_order) values
  ('Aniversário', 'cat-presentes', 1),
  ('Natal',       'cat-presentes', 2),
  ('Páscoa',      'cat-presentes', 3),
  ('Jack',        'cat-presentes', 4),
  ('Outros',      'cat-presentes', 5)
on conflict do nothing;

-- Subcategories — Lazer
insert into subcategories (name, category_id, sort_order) values
  ('Lazer',     'cat-lazer', 1),
  ('Presentes', 'cat-lazer', 2),
  ('Outros',    'cat-lazer', 3)
on conflict do nothing;

-- Payment sources
insert into payment_sources (name) values
  ('Nubank'),
  ('Itaú - Latam Cabelinho'),
  ('Diversos')
on conflict do nothing;

-- Income sources
insert into income_sources (name) values
  ('Gustavo'),
  ('Cabelinho'),
  ('Rendimentos Acumulados')
on conflict do nothing;
