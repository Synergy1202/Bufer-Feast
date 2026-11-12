# JIE_Bulk_order — customer accounts update

**v0.4 · 16 September 2026 · Development/test service only**

Stack: Next.js App Router, React, TypeScript, Tailwind/shadcn, Supabase database and Auth. A local SQLite adapter remains available for guest-only development. No paid service was activated.

## Start here

You already have a working Supabase order table. Follow **`AUTH-SETUP.md`** to upgrade without losing it. Keep your previous project as a backup, apply the new nullable ownership-column migration, preserve your `.env.local`, add the separate publishable key and configure the confirmation-email template.

With Node.js 24+, in the folder containing `package.json`:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

On macOS/Linux use `npm ci`, `npm run build`, then `npm start`. Open the local address printed by Next.js, usually http://localhost:3000. Do not use Live Server or the old standalone `node server.js` command.

## What this release implements

- Customer signup, email confirmation, login and signout of the current browser.
- Supabase Auth sessions in HttpOnly cookies, verified server-side with a fresh `getUser` check. Cookie user objects and client-supplied IDs are not trusted.
- Account-owned test orders and account history scoped to the verified Auth user.
- Guest checkout retained. Older guest records remain separate unless explicitly linked using their private key.
- Atomic guest-record claiming that cannot overwrite another account's ownership.
- Account orders cannot be read using an old guest key alone. New account-order keys are not retained as reusable browser guest credentials after a confirmed save.
- Existing server pricing, input validation and request-idempotency protection.
- Pending account saves survive session errors and require the original account before retrying.
- A stricter Supabase base-URL check and GET-based database probe, fixing the earlier misleading HEAD-check success with a malformed `/rest/v1` base URL.

**This is implementation code, not a claim that email/signup was verified against your private Supabase project.** The assistant has no access to those credentials. You must complete the setup and manually verify signup, email delivery, login and account order access in your own project. The separate workspace preview remains in local guest mode with Auth unavailable.

## Supabase setup and key separation

- `ORDER_STORAGE=supabase`
- `SUPABASE_URL`: HTTPS project BASE URL only. No `/rest/v1`, table path, query or credentials.
- `SUPABASE_SECRET_KEY`: privileged server-only order storage. A legacy service-role key can use `SUPABASE_SERVICE_ROLE_KEY` instead.
- `SUPABASE_PUBLISHABLE_KEY`: separate key for customer authentication.

Both clients run on the Next.js server; no `NEXT_PUBLIC_` keys are needed by this implementation. Never place a secret in a browser variable, commit `.env.local`, or share passwords/session cookies/confirmation links in chat.

For a fresh project, apply the older table migration, then `supabase/migrations/202609160001_customer_order_ownership.sql`. For your existing v0.3 project, apply only the new ownership migration. RLS stays enabled; direct `anon`/`authenticated` table access is denied. Server APIs verify identity and access before using the privileged storage client.

`authConfigured` in `/api/health` reports configuration presence, not proven email delivery. `/api/auth/session` verifies the current session. A signed-out user may have a configured Auth integration but no session.

The default Supabase email sender is limited to project-team testing and low quotas. Use your project-owner email for the first controlled customer-account test; do not add real customers to the project team or disable email confirmation as a workaround. Custom SMTP and production sender policies are separate work. [Official SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp)

## Routes and code map

| Area | Files |
| --- | --- |
| Homepage/menu/basket | `src/app/`, `src/components/menu-view.tsx`, `basket-view.tsx` |
| Signup/login | `src/app/signup`, `src/app/login`, `src/components/auth-form.tsx` |
| Confirmation | `src/app/auth/confirm/route.ts`, `src/app/api/auth/confirm/route.ts`, `src/app/confirm-email` |
| Account | `src/app/account`, `src/components/account-view.tsx` |
| Auth client/session checks | `src/lib/server/auth.ts`, `src/lib/auth-store.ts`, `src/app/api/auth/` |
| Checkout | `src/components/checkout-view.tsx`, `src/lib/save-order.ts` |
| Pricing/ownership | `src/lib/server/orders.ts`, `src/lib/server/order-access.ts` |
| Database adapters | `src/lib/server/storage.ts`, `src/lib/server/sqlite-store.ts` |
| Account history and guest claims | `src/app/api/account/orders`, `src/app/api/orders/[id]/claim` |
| Form schemas | `src/lib/schema.ts`, `src/lib/auth-validation.ts` |
| Shared fictional catalogue | `src/lib/catalog.ts` |

### Request trust boundaries

1. The browser can propose food choices, quantities and an account intent. It cannot assign a trusted customer ID or price.
2. The Next.js API verifies the Auth session against Supabase, or uses the guest-key path for a guest record.
3. The server recalculates totals and rejects a mismatched reviewed total.
4. Supabase/SQLite stores the immutable test-order payload plus the server-assigned owner column.
5. Account list/retrieval requires the verified owner. A guest claim requires both the original private key and an explicit matching account action.
6. Retry lookup requires the same request, private retry key and—when owned—the original account. It does not silently become a different customer's order.

No roles are granted from `user_metadata`. Display names there are display-only. The full operational role model for vendors/admins is not implemented.

## Important limits

- No real food purchase, payment, vendor acceptance, delivery booking, stock reservation, tax policy, refund or cancellation workflow exists.
- Password recovery, account deletion, user-facing email resend, MFA and production account-management workflows are not implemented. Keep controlled test-account credentials safely; do not expose this as a commercial service.
- The foreign key deliberately prevents accidentally deleting an Auth user while its order records remain; a proper retention/deletion workflow is separate work.
- Local mode does not emulate customer login or store passwords. It supports guest test orders only.
- Tests use dummy accounts, simulated Auth HTTP responses and disposable/local databases. Real provider configuration and real-device/browser checks remain necessary.
- Process-local rate limits are basic development guards, not distributed anti-abuse/CAPTCHA protection. Production Auth/email rate limits need review.
- Supabase Auth credentials live with Supabase. Session cookies are HttpOnly and SameSite=Lax; Secure is applied in non-local production contexts. Deploy only behind correctly configured HTTPS.
- Auth token refresh/checks happen in Route Handlers, not Server Components. Protected information is fetched through authorized APIs; client redirects are only user experience, not the security boundary.
- Incoming development request logging is disabled so private confirmation tokens in the initial email-link URL are not printed by Next.js. Do not share confirmation URLs or real-user network traces.
- Do not run the older v0.3 server against this account-enabled database. Older code does not enforce ownership.

## Tests

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:security
npx.cmd playwright install chromium
npm.cmd test
```

`test:security` exercises real application modules and the real SSR SDK with simulated Auth HTTP, plus an isolated disposable SQLite store. Browser auth tests use intercepted responses and do not send email or create real Supabase users. Guest-flow tests exercise the running local server. See **`CHECKS.md`** for actual results and limits.

## Project boundaries

The first journey remains bulk prepared food for households in Lagos. Research was deferred by the user. Kitchens, prices, lead times, delivery fees, dates/windows, units/servings and one-kitchen basket rules are still demonstration assumptions, not validated operations. Allergen/recipe information is unverified. No human product-manager or website-manager approval is claimed.

The user selected **no paid subscriptions for now**. Do not activate SMTP, hosting, Auth upgrades or payment services without discussing costs. Vercel Hobby is not the assumed plan for a commercial launch.

Food images are AI-generated examples. DM Sans is bundled under the SIL Open Font License in `public/assets/DM-Sans-OFL.txt`. The working code name remains JIE_Bulk_order; the learner's Figma screens also use Feranmi, and final spelling is still unconfirmed. Figma is a separate reference, not automatically synced with this code.


### Verified run path and development limitation

Use `npm run build` followed by `npm start` for this release’s initial account test. The optimized build and production server are the verified run path.

Both Turbopack and Webpack development servers started in this constrained workspace, but full browser runs caused the development server to terminate or become unresponsive. The exact cause was not established. Switching the engine alone did not resolve that development-only test instability, so we do not claim it was fixed. `npm run dev` remains a supported Next.js live-editing command, but its full regression run was not verified here.

Default `dev` and `build` use Next.js’s supported Webpack engine. `dev:turbo` and `build:turbo` remain optional investigation paths. None of this changes the Next.js/React/TypeScript application or Supabase design. Run heavy install/build/browser tasks serially on low-memory computers.
