# Fanos Tender — production smoke checklist

Do not push to remote as part of this pass. Run locally against a configured environment.

## Required env

Root `.env` (see `.env.example`):

- `DATABASE_URL`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` (email OTP only; not Firebase Auth)
- `WEB_URL`
- `RESEND_API_KEY` / `EMAIL_FROM` (notification worker)
- `EXPO_ACCESS_TOKEN` (Expo push / FCM delivery)
- Optional import: `EGP_*`
- `ADMIN_USER_ID` — Supabase Auth UUID of the single Superadmin (owner). Required for posting/managing.

Mobile `mobile/.env` (see `mobile/.env.example`):

- `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WEB_URL`
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_EAS_PROJECT_ID`
- `GOOGLE_SERVICES_JSON` for Android FCM native builds

## Health

1. `npm run ready` (or project ready script) — DB + schema OK
2. Open `/api/plans` — JSON plans (or empty prices until staff configures)
3. Open `/` — portal home loads live listings (not fiction fixtures)
4. Open `/?screen=staff` — Superadmin console (owner account in `admins` required)

## Superadmin (single owner)

1. Sign in once with the owner email (Supabase OTP).
2. Copy that user’s Auth UUID into root `.env` as `ADMIN_USER_ID`.
3. Run `npm run migrate` so the UUID is inserted into `admins`.
4. Sign in again → Profile shows **Superadmin** → **Open Superadmin console** (or go to `/?screen=staff`).
5. From the console: create listings, upload vehicle photos, set plan prices + bank instructions, approve payments.
6. Do not share the owner login. When hiring later, add staff by their own email OTP + `admins` row (role split can come later).

## Web flows

1. Browse Vehicles / Public / NGO / Private from portal header
2. Open a listing detail; cover photo loads from `/api/photos/...`
3. Sign in with Supabase email OTP (real inbox code)
4. Save a listing; confirm it appears under Saved after refresh
5. Toggle email alerts on Alerts; confirm `PUT /api/preferences`
6. Submit a bank payment reference from Profile; Superadmin approves in `/?screen=staff`
7. After approval, paid listing details unlock for that account
8. Email deep link `/?bid=<id>` opens the matching listing

## Android (Expo)

1. Sign in with the same Supabase OTP
2. Profile shows `/api/me`; Saved syncs
3. Enable push; confirm Expo push token stored (`pushEnabled` on `/api/me`)
4. Trigger a delivery via worker; notification opens listing

## Brand / demo purge

- No DEMO badges, demo OTP autofill, or fiction homepage fixtures
- Product name is **Fanos Tender** / ፋኖስ ጨረታ
- Legacy `web/app/_archive/portal.jsx` is not routed
- Superadmin (not shared passwords) manages posting for now
- `/terms` and `/privacy` are live legal pages linked from footer and sign-in
