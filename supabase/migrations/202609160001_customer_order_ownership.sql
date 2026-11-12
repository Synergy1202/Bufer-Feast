-- Development upgrade from JIE_Bulk_order v0.3 to v0.4. Existing rows are preserved.
-- Apply in the same development project that contains jie_bulk_order_test_orders.
alter table public.jie_bulk_order_test_orders
  add column if not exists customer_id uuid references auth.users(id) on delete restrict;

create index if not exists jie_bulk_order_test_orders_customer_created
  on public.jie_bulk_order_test_orders(customer_id, created_at desc);

alter table public.jie_bulk_order_test_orders enable row level security;
revoke all on table public.jie_bulk_order_test_orders from anon, authenticated;
grant select, insert on table public.jie_bulk_order_test_orders to service_role;
grant update(customer_id) on table public.jie_bulk_order_test_orders to service_role;

comment on column public.jie_bulk_order_test_orders.customer_id is
  'Verified Supabase Auth owner assigned by the Next.js server. NULL means a legacy/guest test record. Guest claims require the existing private key and explicit user action.';

-- No public account-order policy is added: the browser calls the Next.js API.
-- The API verifies the Auth user and filters/orders by this owner column.
-- Account deletion/retention remains a separate, controlled future workflow.

-- Request a Data API schema-cache refresh after adding the owner column.
notify pgrst, 'reload schema';
