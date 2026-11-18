# Fanos Tender — production smoke checklist

Do not push to remote as part of this pass. Run locally against a configured environment.

## Required env

Root `.env` / `web/.env.local` (see `.env.example`):

- `DATABASE_URL`
- `FIREBASE_PROJECT_ID` + service account (`FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`)
- `NEXT_PUBLIC_FIREBASE_*` (web Auth client)
- `WEB_URL`
- `RESEND_API_KEY` / `EMAIL_FROM` (notification worker)
- `EXPO_ACCESS_TOKEN` (Expo push / FCM delivery)
- Optional import: `EGP_*`
- `ADMIN_USER_ID` — Firebase Auth UID of the single Superadmin (owner)

Mobile `mobile/.env`:

- `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WEB_URL`
- `EXPO_PUBLIC_FIREBASE_*`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (and Expo client if used)
- `EXPO_PUBLIC_EAS_PROJECT_ID`
- `GOOGLE_SERVICES_JSON` for Android FCM native builds

## Health

1. `npm run migrate` — DB + schema OK (account IDs are text for Firebase UIDs)
2. Open `/api/plans` — JSON plans (or empty prices until staff configures)
3. Open `/` — portal home loads live listings
4. Open `/?screen=staff` — Superadmin console (owner in `admins` required)

## Superadmin (single owner)

1. Sign in once with Google or email/password.
2. Copy that user’s **Firebase Auth UID** into `ADMIN_USER_ID`.
3. Run `npm run migrate`.
4. Sign in again → Profile shows **Superadmin** → **Open Superadmin console**.
5. Create listings, upload photos, set plan prices + bank instructions, approve payments.
6. Do not share the owner login. When hiring later, add staff by their own Firebase UID in `admins`.

## Web flows

1. Browse Vehicles / Public / NGO / Private
2. Open a listing detail; cover photo loads from `/api/photos/...`
3. Sign in with **Google** and with **email/password**
4. Save a listing; confirm under Saved after refresh
5. Toggle email alerts; confirm `PUT /api/preferences`
6. Submit a bank payment reference; Superadmin approves in `/?screen=staff`
7. After approval, paid listing details unlock
8. Deep link `/?bid=<id>` opens the matching listing
9. `/terms` and `/privacy` load

## Android (Expo)

1. Sign in with Google and email/password
2. Profile shows `/api/me`; Saved syncs
3. Enable push; confirm Expo push token stored
4. Trigger a delivery via worker; notification opens listing

## Brand

- Product name is **Fanos Tender** / ፋኖስ ጨረታ
- Auth is Firebase (Google + email/password); FCM remains for push only
