-- ShopOS initial production schema draft for Supabase PostgreSQL.
-- Review and apply only after a developer/DBA review. This file is not applied automatically.

create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gstin text,
  gst_scheme text not null default 'composition' check (gst_scheme in ('composition','regular','unregistered')),
  state_code text default '27',
  created_at timestamptz not null default now()
);

create table if not exists public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','sales','stock')),
  active boolean not null default true,
  primary key (shop_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sku text not null,
  name text not null,
  category text not null check (category in ('Refrigerators','Washing machines','Air conditioners','Televisions','Fans','Mixers and small appliances')),
  brand text,
  model text,
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  selling_price numeric(12,2) not null default 0 check (selling_price >= 0),
  reorder_level integer not null default 0 check (reorder_level >= 0),
  serial_tracked boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, sku)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id),
  movement_type text not null check (movement_type in ('opening','purchase_received','sale','customer_return','supplier_return','repair_out','repair_return','damage','adjustment','reservation','release_reservation')),
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_bucket text not null default 'available' check (stock_bucket in ('available','reserved','under_repair','damaged','in_transit')),
  reference_type text,
  reference_id uuid,
  reason text,
  created_by uuid references auth.users(id),
  client_transaction_id uuid not null,
  created_at timestamptz not null default now(),
  unique (shop_id, client_transaction_id)
);

create index if not exists stock_movements_product_idx on public.stock_movements(shop_id, product_id, created_at);
create index if not exists products_name_idx on public.products(shop_id, name);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  gstin text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  supplier_id uuid references public.suppliers(id),
  supplier_invoice_no text,
  purchase_date date not null default current_date,
  status text not null default 'draft' check (status in ('draft','ordered','part_received','received','cancelled')),
  total_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id),
  ordered_qty integer not null check (ordered_qty > 0),
  received_qty integer not null default 0 check (received_qty >= 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.bills_of_supply (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id),
  document_number text,
  financial_year text not null,
  issue_date timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft','issued','cancelled')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  composition_declaration text not null default 'COMPOSITION TAXABLE PERSON, NOT ELIGIBLE TO COLLECT TAX ON SUPPLIES',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills_of_supply(id) on delete cascade,
  product_id uuid not null references public.products(id),
  description text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  bill_id uuid references public.bills_of_supply(id),
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('cash','upi','card','bank_transfer','other')),
  reference text,
  paid_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Production checklist:
-- 1) Enable RLS on every shop-scoped table.
-- 2) Add policies verifying auth.uid() is an active member of the row's shop.
-- 3) Prevent client-side direct edits/deletes to stock_movements and issued bills.
-- 4) Generate bill numbers in a server-side transaction, scoped by shop and financial year.
-- 5) Use server-side functions to atomically validate stock and issue a bill.
-- 6) Add repair/job-card, serial-unit, customer-order, return and stocktake tables in phase 2.
-- 7) Never expose the Supabase service-role key in browser code.
