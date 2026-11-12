# Agreed technology direction

**14 September 2026**

## User decisions

- Change the existing prototype to **Next.js**.
- Use **Supabase** as the database/authentication/storage platform.
- **No paid subscriptions for now.** Discuss costs and obtain approval before activating paid services.
- Stop blocking development on Figma cleanup. Figma remains a separate reference.

## Implemented in this release

- Next.js App Router with React and TypeScript.
- Tailwind CSS v4 with the current shadcn/ui Base UI setup and selected UI primitives.
- Next.js Route Handlers instead of the old standalone HTTP server.
- Shared Zod validation and server-authoritative test pricing.
- A local SQLite test adapter and a separate Supabase PostgreSQL adapter.
- A protected SQL migration for guest test-order records.
- Playwright browser/API tests, a restart check, and automated accessibility checks.
- Biome for linting/formatting. The starter pulled an unsupported ESLint 9 release, while its React plugin did not declare ESLint 10 support. Rather than force incompatible dependencies, this release uses the maintained Biome alternative supported by the Next.js CLI.

Installed versions are pinned by `package-lock.json`. The package manifest records the direct dependencies. Versions were checked against the package registry during this migration; 'newest' is not a substitute for compatibility and tests.

## Prepared, not connected or implemented

- Supabase cloud storage requires the user's own project, migration and local environment configuration.
- Supabase Auth account pages and file uploads are future work.
- Payment-provider integration and deployment are future work.
- No external account, subscription, repository or commercial deployment was created.

## Alternatives discussed

- Styling: Tailwind/shadcn versus CSS Modules/custom CSS.
- Database/login bundle: Supabase versus Neon + Clerk, or PostgreSQL + Better Auth.
- Hosting to assess later: Vercel, Railway or Render.
- Payments to assess later: Paystack or Flutterwave, starting in test mode.

These are alternatives, not extra libraries or services to install together. Supabase was selected to reduce the number of separate providers while learning.

HTML, CSS, JavaScript, Node.js and SQLite are not obsolete. The migration changes application structure and deployment options. The approved long-term database direction is managed PostgreSQL through Supabase, not a local SQLite file on serverless hosting.

## Official references checked

- Next.js recommended setup and CLI: [5](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- shadcn/ui Next.js setup: [1](https://ui.shadcn.com/docs/installation/next)
- Supabase's Next.js/database/auth/storage guides: [4](https://supabase.com/docs/guides/getting-started)
- Better Auth's recommendation for new Auth.js projects: [3](https://better-auth.com/blog/authjs-joins-better-auth)
- Vercel Hobby restrictions: [1](https://vercel.com/docs/plans/hobby)

No product-manager or website-manager sign-off is implied by these technology choices.


## 16 September 2026 — accounts implemented in code

The user confirmed a matching cloud test-order row after fixing the project URL and then configured the Auth Site URL. v0.4 adds Supabase Auth via the current `@supabase/ssr` package, server-verified sessions, account-owned orders and explicit guest claiming. A new publishable-key setting, ownership migration and confirmation-email template are required. Workspace authentication remains unconfigured; no private project credentials or real email/login test were supplied to the assistant. No paid service was activated. See `AUTH-SETUP.md` and the current `CHECKS.md`.
