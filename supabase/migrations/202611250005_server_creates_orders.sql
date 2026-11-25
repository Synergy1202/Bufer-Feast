-- Close the order price loophole.
--
-- Before: a signed-in customer could insert rows into orders and order_items
-- straight through Supabase's API, choosing their own total_price. Payment
-- confirmation only checks the customer paid that same total, so an order
-- could be paid for at any price.
--
-- After: only the server (secret key) creates orders, using prices it works
-- out from the menus (placeOrderAction in src/app/checkout/actions.ts).
-- Customers and vendors can still read their own orders as before.
--
-- Run AFTER deploying the matching code; before that, the old checkout code
-- creates orders as the customer and would be refused.

-- 1. Remove every INSERT policy on orders and order_items (the known one is
-- "customer create own order"; order_items' name may differ).
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders', 'order_items')
      AND cmd IN ('INSERT', 'ALL')
  LOOP
    IF p.cmd = 'INSERT' THEN
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
      RAISE NOTICE 'Dropped insert policy "%" on %', p.policyname, p.tablename;
    ELSE
      -- An "ALL" policy also covers reading, so it is not dropped here; the
      -- REVOKE below still stops inserts through it.
      RAISE NOTICE 'Kept ALL policy "%" on % (inserts are revoked below)', p.policyname, p.tablename;
    END IF;
  END LOOP;
END $$;

-- 2. Belt and braces: signed-in users and visitors may not insert at all,
-- whatever policies exist now or later. (Revoking on the table also removes
-- any column-level insert grants.)
REVOKE INSERT ON TABLE public.orders FROM anon, authenticated;
REVOKE INSERT ON TABLE public.order_items FROM anon, authenticated;

-- Check afterwards: should list no INSERT policies.
--   select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' and tablename in ('orders', 'order_items');
