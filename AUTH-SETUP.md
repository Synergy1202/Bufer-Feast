# Customer accounts — setup for your own Supabase project

**v0.4 · 16 September 2026 · No paid services activated**

Your cloud test-order save was already verified on your computer. This update adds customer signup, email confirmation, login/logout, account-owned order history and explicit guest-record linking. It needs the following configuration in **your existing development project**.

The separate Arena preview does not use your computer's environment file. It stays in local guest mode with authentication unavailable until a real project is configured. It must not pretend to create accounts.

## 1. Keep a backup and stop the older server

Keep your v0.3 project folder and original ZIP. Stop its running Next.js terminal with **Ctrl+C**.

Extract the v0.4 ZIP into a NEW folder and open its `jie_bulk_order-next` folder in VS Code. Use the folder containing `package.json`.

Copy your existing **`.env.local` locally on your computer** into the new project root. Do not upload it, paste it into chat, overwrite it with `.env.example`, or commit it to Git. Your Supabase database records remain in the same project; this does not delete them.

Do not keep an old v0.3 server running against the account-enabled database. Older code does not enforce the new ownership rules.

## 2. Add the ownership column without deleting old records

Open this new file in VS Code:

```text
supabase/migrations/202609160001_customer_order_ownership.sql
```

Copy it into **Supabase → SQL Editor** in the same development project and run it.

This adds a nullable `customer_id`, an index and the server's limited update permission. Existing records remain guest records with `customer_id = NULL`. RLS stays enabled and direct browser table access remains restricted. Do not drop/recreate the table or turn off RLS.

This migration assumes the original `jie_bulk_order_test_orders` table already exists, as in your working v0.3 setup. A completely new project must apply the older migration first.

## 3. Add ONE additional key to `.env.local`

Keep your working base URL, secret key and `ORDER_STORAGE=supabase`. Add the **publishable key** from the SAME project's API Keys settings:

```dotenv
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_VALUE
```

The roles are different:

- `SUPABASE_SECRET_KEY`: privileged, SERVER-ONLY access to the order table. Keep it private.
- `SUPABASE_PUBLISHABLE_KEY`: used by the customer-authentication client, not the privileged database client.

Do not replace the secret with the publishable key, or put a secret value in the publishable-key variable. This app performs Auth calls through Next.js and uses HttpOnly session cookies; no browser Supabase client or `NEXT_PUBLIC_` key is required.

**Never share passwords, secret keys, `.env.local`, session cookies or confirmation links in chat.**

## 4. Configure the email confirmation link

In Supabase:

1. Under **Authentication → URL Configuration**, keep **Site URL** equal to your actual local app address, normally `http://localhost:3000`. This is your WEBSITE address, not the Supabase project URL.
2. Under the Email sign-in provider, keep **Email** enabled and **Confirm email ON**.
3. Open **Authentication → Email Templates / Emails → Confirm signup** (the exact menu wording may vary).
4. Replace that template's body with the contents of **`supabase/email-confirmation.html`**, then save it. Only change the Confirm-signup template for this step.

The template uses Supabase's `{{ .SiteURL }}` and `{{ .TokenHash }}` variables. Do not replace them with an actual token. The link opens `/auth/confirm`, stores the token briefly in an HttpOnly cookie and redirects to a clean confirmation page. The user must click **Confirm email and sign in**. A simple GET by an email scanner does not consume the link.

### Free/default sender limitation — read before signing up

Supabase's built-in email sender is for limited testing. It currently restricts recipients to the project's team and has a very low sending limit (the documentation currently says 2 messages per hour, which may change).

**For the first test, use your own project-owner email address**, but choose a unique password for this new CUSTOMER account. Your Supabase dashboard login and the app's customer login are separate accounts.

Do not invite customers into your Supabase project team just to bypass this restriction. General customer email delivery needs an appropriate custom SMTP setup, to be agreed separately. Do not disable email confirmation or activate a paid service as a workaround.

Official reference: [Supabase default SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

## 5. Install the update and run it

In the new project terminal, using Node.js 24+:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Use the SAME app address as Site URL. If the port is already in use, stop the older server before starting this version. If you intentionally use another port, update Site URL to match. Do not mix `localhost` with `127.0.0.1` during this first cookie/email test.

`/api/health` should show version `0.4.0`, `database: Supabase PostgreSQL`, and `authConfigured: true` when the settings are present. **Configured does not prove email delivery or successful login.** The previous `authConnected` field has been replaced with the clearer `authConfigured` name.

## 6. Test your customer account

1. Open **Create account** / `/signup` on your local website.
2. Use your project-owner email, a display name such as Demo Customer, and a new strong password. Never reuse or share the password for administering Supabase.
3. Submit once. Check your inbox/spam for the confirmation. Do not repeatedly submit if the sender is rate-limiting.
4. Open the private confirmation link, then press **Confirm email and sign in**. If the provider confirms the email without a session, the app directs you to Log in instead.
5. Confirm My account shows your own email. Then create a NEW fictional test order while signed in.
6. In Supabase, that new order should have your Auth user's UUID in `customer_id`.
7. Open a separate private/incognito window. The order URL alone must NOT reveal account order details. Log in with the same customer account; its account-order history should then be available without copying browser lookup keys.
8. Sign out. An account-owned order must no longer be readable in that signed-out session.

Use fictional delivery names, addresses and phone numbers. Account email/password are real credentials you control, stored/managed by Supabase Auth—not in the food-order table.

## Optional: link your OLD guest test record

In the original browser that holds its private key:

1. Sign in to the intended customer account.
2. Open the guest record under **My test orders → Guest records in this browser**.
3. Click **Link this guest record to my account**.
4. Check the email in the confirmation dialog before agreeing.

The server verifies both the logged-in user and the original guest key, and atomically links only an unowned record. Linking does not change its food, delivery details or total. After linking, the old guest key alone no longer grants access. Nothing is linked automatically just because someone signs in on a shared computer.

## If something fails

- `AUTH_NOT_CONFIGURED`: check the added publishable-key setting and restart Next.js.
- Missing `customer_id` / table-column error: apply the new migration; do not delete the old table.
- Signup email rejected: use the existing project-owner/team email for this limited test, or discuss custom SMTP separately.
- Rate limit: wait; do not repeatedly click signup/confirmation.
- Confirmation expired/used: try Log in if the email was already confirmed. Password recovery and resend UI are not implemented in this release.
- `AUTH_REQUIRED`, `SESSION_EXPIRED` or `ACCOUNT_CHANGED` during a pending save: log back into the original account and retry the SAME request. Do not create a duplicate checkout.

Report only safe error codes or whether a step succeeded. No secret values or private confirmation URLs are needed.

### Running while editing later

The initial test uses a production build because that is the run path verified for this update. After changing code, stop the server, rebuild and start again. `npm run dev` offers live editing, but full development-mode browser regression runs were unstable in the workspace; that remains an acknowledged limitation rather than a claimed fix.
