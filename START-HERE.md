# START HERE — JIE_Bulk_order accounts v0.4

The signup/login/account-order code is ready for configuration and your own provider test. No real Supabase credentials are included, and no email or paid service was activated by the assistant.

## Upgrade in this order

1. Keep your working v0.3 folder as a backup and stop its terminal server with **Ctrl+C**.
2. Extract this ZIP into a NEW folder. Open the folder containing **package.json** in VS Code.
3. Copy your existing **.env.local** into the new folder LOCALLY on your computer. Do not upload/share it or replace it with .env.example.
4. Run the new SQL file in your existing Supabase development project's SQL Editor:

   `supabase/migrations/202609160001_customer_order_ownership.sql`

   It preserves existing records and adds a nullable customer_id. Keep RLS enabled.
5. Add your project's separate publishable key to .env.local:

   ```dotenv
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_VALUE
   ```

   Keep the existing corrected base URL, server secret and ORDER_STORAGE=supabase.
6. In Supabase, keep the app's Site URL correct and **Confirm email ON**. Copy `supabase/email-confirmation.html` into the **Confirm signup** email template.
7. With Node.js 24+, run:

   ```powershell
   npm.cmd ci
   npm.cmd run build
   npm.cmd start
   ```

   Use the same local app address as Site URL, normally http://localhost:3000.

## First test

Use the email address of your existing Supabase project owner and a NEW, unique customer-account password. Default Supabase email delivery is restricted to project-team addresses and low testing quotas; do not repeatedly submit or disable confirmation.

Sign up → open your own email link → press Confirm email and sign in → check My account → save a NEW fictional order while signed in → view it from account history.

In an incognito window, that account order must require login. Logging in with the same customer account should retrieve it without copying a guest key. Older guest records can be explicitly linked from their detail page if they belong to you.

Full steps and troubleshooting: **AUTH-SETUP.md**. Code map: **README.md**. Test evidence/limitations: **CHECKS.md**.

Never send passwords, secret keys, cookies, .env.local or private confirmation links in chat. Account email is yours; delivery names/addresses/phone numbers must remain fictional. Payments and real deliveries are not connected.
