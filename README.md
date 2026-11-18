# Fanos Tender

A responsive website, staff console, and Android app for public, NGO, private, and vehicle bids in Ethiopia. Buyers follow the issuer's instructions to submit a bid. Vehicle listings support an authorized photo gallery and separate records for separate lots.

## Local setup

1. Install Node.js 22 or newer and run `npm ci` in the repository root.
2. Provision a PostgreSQL database. Copy [`.env.example`](.env.example) to `.env` and [`web/.env.example`](web/.env.example) to `web/.env.local`.
3. Create a Firebase project. Enable **Authentication** with **Google** and **Email/Password**. Add a Web app and an Android app. Download a service account JSON for the API (or set `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`). Copy the web config into `NEXT_PUBLIC_FIREBASE_*` and `EXPO_PUBLIC_FIREBASE_*`.
4. Run `npm run migrate` to create the `bids` schema. Sign in once as the owner (Google or email), copy their **Firebase Auth UID** into `ADMIN_USER_ID`, and run migrate again so they become Superadmin.
5. Run `npm run dev` and open the URL printed by Next.js. Sign in, open **Superadmin**, then add notices, upload vehicle photos, set ETB prices and payment instructions, and verify payment references. Blank plan prices disable subscriptions.
6. Copy [`mobile/.env.example`](mobile/.env.example) to `mobile/.env`. Set the API host, Firebase public config, and Google OAuth client IDs. Use a reachable HTTPS host for a physical device. Run `npm run android`. Use an Expo development or EAS preview build for push testing (`EXPO_PUBLIC_EAS_PROJECT_ID`, `GOOGLE_SERVICES_JSON` for FCM).
7. Configure Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `WEB_URL`) and run `npm run worker` as a separate process for email/push delivery.

## Public tender import

The worker starts with imports disabled. Confirm permission and obtain an official feed or a permitted adapter before setting `EGP_IMPORT_APPROVED=true` and an HTTPS `EGP_FEED_URL`. The adapter must return a JSON object with a `notices` array. Each notice uses `reference` or `sourceId`, `lot` if applicable, `title`, `issuer`, `region`, an ISO 8601 `deadline` with a numeric offset or Z, `status` of `active` or `cancelled`, and an official `sourceUrl`. Optional `description` carries the notice text in its original language. Provide `EGP_FEED_TOKEN` for a bearer-protected feed.

## Verification and release

- `npm test` runs the API and worker integration tests using embedded PostgreSQL.
- `npm run build` builds the production website and API.
- From `mobile`, run `npx expo export --platform android` to check Android bundling.
- Before release: real notices in all four sections, Google and email sign-in, payment verification, and push on a physical Android device.

## Local vehicle design preview

Set `VEHICLE_REFERENCE_PREVIEW` in the web server environment to the absolute path of the supplied 720 × 720 GoBid reference PNG, then open `/vehicle-preview`. Keep it unset on public deployments.
