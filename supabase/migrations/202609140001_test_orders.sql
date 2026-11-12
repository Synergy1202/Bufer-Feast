-- Apply once in YOUR Supabase project's SQL editor. This does not create a paid service.
-- Server-only guest test records. Auth, vendor onboarding and uploads are later stages.
create table if not exists public.jie_bulk_order_test_orders (
  id text primary key,
  request_key text not null unique,
  request_hash text not null,
  access_hash text not null,
  created_at timestamptz not null,
  status text not null check (status = 'received'),
  payload jsonb not null
);

alter table public.jie_bulk_order_test_orders enable row level security;
-- No public/client access: all reads/writes go through our validated Next.js API.
revoke all on table public.jie_bulk_order_test_orders from anon, authenticated;
grant select, insert on table public.jie_bulk_order_test_orders to service_role;

comment on table public.jie_bulk_order_test_orders is
  'Fictional test-order records only. Server-side private-access-key checks are required. No real fulfilment or payments.';
