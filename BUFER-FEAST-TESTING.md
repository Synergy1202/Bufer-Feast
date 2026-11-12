# Bufer Feast — bundled local changes and verification

This is a **local-only** update. It is **not deployed**. Do not connect it to the live Supabase project for testing without the owner's permission; a localhost copy can still write production data if its environment variables point at production.

## Changes in this bundle
- Existing homepage hero and Trusted Kitchens copy preserved.
- Customer registration collects and saves address, latitude, longitude, and Place ID (when Maps is configured) into the admin-visible `profiles` row. Ordinary signup also saves them in Auth metadata.
- Google OAuth callback now creates a missing customer profile and asks Google sign-in customers to complete an address before ordering.
- Customer profile status becomes `active` only after confirmation is processed in the app; vendor status is never auto-approved.
- Existing address component now shows map, location detection, searchable address, click-to-select and draggable pin; it is used for customer and vendor signup and continues to work as plain text if Maps is not configured.
- Existing vendor form still uploads documents and creates `fernami_vendor_applications` records for admin review. Vendor coordinates no longer silently become (0,0) when absent.
- Restored the missing `/confirm-email` page needed by the supplied email template.

## Actions required outside the repository
1. Use **a separate Supabase development project**, not live credentials, for safe end-to-end tests. Supply `.env.local` locally; do not share its keys.
2. In development Supabase, run `supabase/migrations/202611100001_profile_address_locations.sql` once in SQL Editor before registration testing. Existing vendor fields, profiles, applications table, and `vendor-documents` bucket must exist (these were already referenced in the inherited code).
3. Under Authentication → Providers → Email: enable Confirm email. Under Authentication → Email Templates → Confirm signup, use `supabase/email-confirmation.html`. Set **Site URL** and additional redirect URLs to your local test origin and `/auth/callback`. For production later, use `https://www.buferfeast.com` and corresponding redirect URL.
4. Configure Supabase **custom SMTP** for deliverability and inspect Auth Logs/email provider logs; code cannot guarantee arrival without it. If no mail arrives after a successful signup, check logs and sending quota before retrying.
5. Enable Google sign-in in Supabase Authentication, configure Google OAuth client/redirect in Google Cloud, and whitelist the intended app callback in Supabase.
6. Set `NEXT_PUBLIC_GOOGLE_MAPS_KEY` to a browser key allowed on localhost, with Maps JavaScript, Places and Geocoding enabled. Map loading and geolocation require a browser and appropriate permissions; location generally requires HTTPS except localhost.
7. Install **Node.js 24+** (the inherited package.json requires it). Then in CMD: `npm ci`, `npm run typecheck`, `npm run dev` and open `http://localhost:3000`.

## One-pass acceptance checklist
- Register a new customer with email/password → verify email link received → confirm → log in → address shown in Admin → Customers and status active.
- Register with Google → complete delivery location after OAuth → address shown in Admin → Customers.
- Use search, map click, marker dragging and current-location button on desktop and mobile; verify address and coordinates recorded. Without Google key, manual address remains available.
- Submit new vendor with required identity/CAC documents → confirm email → verify the vendor application under Admin → Vendor Applications → approve → verify vendor status. Vendor is **not** auto-approved by confirming email.
- Confirm homepage hero and Trusted Kitchens copy on desktop and mobile.

## Important limitations
- Email sending is handled by Supabase/SMTP, not by the Next.js UI. Live email delivery, OAuth provider configuration, Supabase schema/bucket policies and admin approval cannot be confirmed without a configured safe environment and end-to-end tests.
- Registration endpoints under `/api/auth/signup` and `/api/auth/vendor-signup` are separate legacy API workflows. The current `/register` and `/signup` forms use server actions, which are the paths changed in this bundle. Do not use the legacy endpoints for new vendor onboarding.
- An already-registered user with an incomplete profile might need a one-time data repair; no live data backfill is run by this ZIP.
