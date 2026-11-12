# v0.4 accounts — check report

**16 September 2026 · Development/test application, not a production sign-off**

## Verified run path

- Optimized Next.js **Webpack production build** passed.
- TypeScript typecheck and Biome source/script lint passed.
- **14 Playwright browser/API scenarios passed against the production server.**
  - Auth UI cases use intercepted responses: signup validation, confirmation guidance, explicit confirmation POST, login/logout, safe redirects, identity-scoped history and narrow viewports.
  - The actual Next.js callback was checked for an HttpOnly temporary confirmation cookie and no token consumption on GET.
  - Actual unauthenticated account endpoints returned 401.
  - The existing guest discovery, basket, checkout, private retrieval, interrupted-save retry, pricing/validation and responsive checks passed against the real local Next.js server.
- **17 isolated security/application checks passed.** These execute real source modules and the real Supabase SSR SDK with simulated Auth HTTP responses and a disposable SQLite database. They cover owner-only reads, rejected forged/client IDs, account-bound retries, explicit atomic guest claims, server-verified identity instead of cookie user claims, server-side session refresh, cookie attributes, rejected tokens, guest-key removal for account orders, and pending-save preservation on session errors.
- Separate production-server restart test passed: the same local record remained retrievable after restarting.
- Missing Supabase configuration failed explicitly instead of silently using local storage.
- The stricter URL/GET health probe rejected REST-suffix URLs and could not treat a normalized 404/empty response as a healthy table read.
- Automated WCAG 2 A/AA and 2.1 AA tagged checks found **zero violations in 6 exercised account UI states**. Auth data was simulated for these UI checks. Manual-review items remain; this is not a complete accessibility audit.
- npm audit reported **0 known vulnerabilities** at packaging time. This is a point-in-time advisory result, not proof against every vulnerability.

## Important unresolved limitation

Full development-server regression runs were not completed successfully in this workspace. Turbopack and Webpack development servers both started, but terminated or became unresponsive during browser runs. A constrained-workspace Turbopack production build was also killed. The exact underlying cause was not established; changing the development engine alone did not fix it.

The verified initial setup is **npm run build → npm start**, with the supported Webpack production build. `npm run dev` remains available for live editing, but its full workspace regression is NOT claimed as passed. These limitations are reported rather than hidden.

## What was NOT tested or claimed

- No actual Supabase user account, email confirmation delivery or login was performed against the user's private project; no real credentials were supplied to the assistant. **The live provider test is still the user's next checkpoint after configuration.**
- The new hosted SQL migration must be applied and verified in the user's development project. Local SQLite policy tests do not substitute for a real Supabase deployment test.
- No payments, live vendor operations, stock reservations, real delivery, account recovery/deletion or production SMTP were implemented or tested.
- No real-device Safari/iOS test, full assistive-technology audit, penetration test, business/legal/privacy validation or human product/website-manager approval was performed.

Use fictional order details and controlled test-account credentials. Never share passwords, server keys, session cookies or private confirmation links.
