> **v0.4 upgrade:** If your existing table already works, follow `AUTH-SETUP.md` for the new ownership migration, publishable key and email template. Do not recreate your existing table.

# Connect Supabase — only when your local Next.js app runs

**Selected platform: Supabase. Budget: no paid subscriptions for now.**

No Supabase account or project has been created or connected on your behalf. This guide prepares **test-order database storage**, not customer login, vendor accounts or media uploads.

## 1. Create a development project

Create/sign into your own Supabase account and create a **separate development project** on an appropriate free plan. Review the plan shown in the dashboard; do not activate a paid upgrade for this step.

Use fictional data. Hosting region, real personal-data handling and production plan limits require review before a business launch.

## 2. Create the protected table

In VS Code, open:

```text
supabase/migrations/202609140001_test_orders.sql
```

In your development project's **SQL Editor**, paste that file's contents and run it. Do not run this against an unrelated production project.

It creates `public.jie_bulk_order_test_orders`, enables Row Level Security, and restricts direct client access. The Next.js server—not the public browser client—is responsible for validating and accessing these guest test records.

## 3. Configure the server locally

Copy `.env.example` to a new file named **`.env.local`** in the same folder as `package.json`.

Use your project's actual URL and **server-side secret key** from its API settings:

```dotenv
ORDER_STORAGE=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SECRET_KEY
NEXT_TELEMETRY_DISABLED=1
```

A legacy service-role key can be supplied as `SUPABASE_SERVICE_ROLE_KEY` instead. Do not use an anonymous/publishable browser key for this server-only table access.

**Do not paste secrets into chat. Do not commit `.env.local`, screenshot its values, or prefix the secret with `NEXT_PUBLIC_`.** Enter them only in your own environment file. `.env.local` is ignored by Git and excluded from the shared code package.

## 4. Restart Next.js

Stop the terminal server with **Ctrl+C**, then run:

```powershell
npm.cmd run dev
```

Open **http://localhost:3000/api/health** on your computer. When the database connection and migration work, it should report:

```json
{
  "mode": "supabase-test",
  "database": "Supabase PostgreSQL",
  "authConnected": false,
  "paymentsConnected": false
}
```

There will be other fields too. The `false` values are intentional: this application does not yet implement account login or payments.

If setup fails, the endpoint returns an error. It must **not** say that Supabase is connected or silently save into SQLite instead.

## 5. Save a NEW fictional test order

Open a sample menu → basket → test checkout. Check that the storage label now says **Supabase PostgreSQL connected**. Save a new fictional order and retrieve it again.

You can inspect its row in the Supabase Table Editor. The order-access key is hashed in the table; private guest retrieval goes through the Next.js API.

**Old local records are not automatically migrated.** Their browser references can remain visible but will not exist in your new Supabase database. That does not mean a new cloud save failed.

## What comes after this

We will separately implement Supabase Auth with its current Next.js server-side integration, real access-control rules, customer/vendor roles, and appropriate upload policies. We will not treat browser guest lookup keys as a finished account system.

Official starting points: [4](https://supabase.com/docs/guides/getting-started) [1](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
