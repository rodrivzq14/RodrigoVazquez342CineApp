-- =========================================================
-- Candy bar: categorías, productos y combos
-- =========================================================

create table if not exists product_categories (
  id serial primary key,
  nombre text not null unique
);

create table if not exists products (
  id serial primary key,
  category_id int not null references product_categories on delete restrict,
  nombre text not null,
  descripcion text,
  precio numeric not null check (precio >= 0),
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Un combo es siempre: 1 entrada general + los productos de combo_items, a precio fijo
create table if not exists combos (
  id serial primary key,
  nombre text not null,
  descripcion text,
  precio numeric not null check (precio >= 0),
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists combo_items (
  combo_id int not null references combos on delete cascade,
  product_id int not null references products on delete restrict,
  cantidad int not null default 1 check (cantidad > 0),
  primary key (combo_id, product_id)
);


-- ---------- Policies (mismo criterio que el resto: todos leen, el admin escribe) ----------
alter table product_categories enable row level security;
alter table products enable row level security;
alter table combos enable row level security;
alter table combo_items enable row level security;

drop policy if exists "leer categorias" on product_categories;
create policy "leer categorias" on product_categories for select using (true);
drop policy if exists "admin categorias" on product_categories;
create policy "admin categorias" on product_categories for all using (is_admin()) with check (is_admin());

drop policy if exists "leer productos" on products;
create policy "leer productos" on products for select using (true);
drop policy if exists "admin productos" on products;
create policy "admin productos" on products for all using (is_admin()) with check (is_admin());

drop policy if exists "leer combos" on combos;
create policy "leer combos" on combos for select using (true);
drop policy if exists "admin combos" on combos;
create policy "admin combos" on combos for all using (is_admin()) with check (is_admin());

drop policy if exists "leer combo_items" on combo_items;
create policy "leer combo_items" on combo_items for select using (true);
drop policy if exists "admin combo_items" on combo_items;
create policy "admin combo_items" on combo_items for all using (is_admin()) with check (is_admin());


-- ---------- Log de actividad (precios del candy) ----------
create or replace function public.log_candy() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_que text := case tg_table_name when 'products' then 'producto' else 'combo' end;
begin
  if tg_op = 'INSERT' then
    perform registrar('Creó ' || v_que, new.nombre || ' · $' || new.precio);
  elsif new.precio is distinct from old.precio then
    perform registrar('Modificó precio', new.nombre || ': $' || old.precio || ' → $' || new.precio);
  else
    perform registrar('Modificó ' || v_que, new.nombre);
  end if;
  return new;
end $$;

drop trigger if exists trg_log_products on products;
create trigger trg_log_products after insert or update on products
  for each row execute function log_candy();

drop trigger if exists trg_log_combos on combos;
create trigger trg_log_combos after insert or update on combos
  for each row execute function log_candy();


-- Categorías de arranque
insert into product_categories (nombre) values ('Pochoclos'), ('Bebidas'), ('Golosinas')
on conflict (nombre) do nothing;
