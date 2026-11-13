# Bufer Feast testing auth and vendor email setup

These instructions apply to the separate testing deployment only. Do not change the live `buferfeast.com` domain or production Supabase project.

## Supabase Confirm Signup template

In the Supabase project used by `https://bufer-feast.vercel.app`, open **Authentication → Email Templates → Confirm Signup**.

Set the subject to:

`Confirm your Bufer Feast account`

Use this template body:

```html
<h2>Confirm your Bufer Feast account</h2>
<p>Thanks for signing up. Confirm your email address to continue.</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Confirm email address</a></p>
<p>If you did not create this account, you can ignore this email.</p>
```

The customer and vendor signup actions pass an explicit redirect URL ending in `/auth/confirm`. The template uses `{{ .RedirectTo }}` so the link returns to the testing site without changing the Supabase project's Site URL. The route stores the token hash in a short-lived HttpOnly cookie and asks the user to confirm on the site. This avoids consuming one-time links when email security scanners prefetch URLs.

Keep the Supabase confirmation email link tracking disabled if your email provider rewrites links.

## Supabase redirect allow list

In the same testing Supabase project's Authentication URL configuration, allow:

- `https://bufer-feast.vercel.app/auth/confirm`
- `https://bufer-feast.vercel.app/auth/callback` (legacy callback support)

Do not add or change the live domain unless the production environment is being configured separately.

## Vercel testing environment variables

Set these only on the Vercel project that deploys `https://bufer-feast.vercel.app`:

| Variable | Value / purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://bufer-feast.vercel.app` |
| `RESEND_API_KEY` | Resend API key used by the server to send vendor rejection notices |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `Bufer Feast <notices@your-verified-domain>` |
| `VENDOR_MAX_RESUBMISSIONS` | Optional. Defaults to `2` |
| `VENDOR_REAPPLICATION_COOLDOWN_DAYS` | Optional. Defaults to `7` |

The existing Supabase SMTP configuration remains responsible for signup confirmation and resend emails. The Resend API variables above are used for vendor rejection notifications. Never expose the API key through a `NEXT_PUBLIC_` variable or commit it to Git.

After changing Vercel environment variables, redeploy the testing project.

## Database migration

Run `supabase/migrations/202611130001_vendor_reapplication_security.sql` in the testing Supabase SQL editor after reviewing it. It adds vendor application history and reapplication fields, a server-only reapplication function, and triggers that prevent authenticated clients from changing profile roles/statuses or vendor review fields.

The migration preserves existing profiles and applications. It seeds a first history row for existing vendor applications.

## Manual verification still required

- Confirm signup email links for both customer and vendor accounts.
- Expired confirmation link, then resend a fresh link.
- Rejected vendor email delivery and retry after a simulated Resend failure.
- Reapplication cooldown and maximum resubmissions.
- RLS and trigger behavior using a normal authenticated session, not the service-role key.
