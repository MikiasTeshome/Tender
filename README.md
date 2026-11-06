# Bid Ethiopia

A responsive website, staff console, and Android app for public, NGO, private, and vehicle bids in Ethiopia. Buyers follow the issuer's instructions to submit a bid. Vehicle listings support an authorized photo gallery and separate records for separate lots.

## Local setup

1. Install Node.js 22 or newer and run `npm ci` in the repository root.
2. Provision a PostgreSQL database and a Supabase project for managed email authentication. Use a direct PostgreSQL connection or a session-mode pooler. Copy `.env.example` to `.env` for the database migration and worker. Copy the same server variables to `web/.env.local` for Next.js. Use the Supabase public key for `SUPABASE_ANON_KEY`, never a service-role key.
3. In Supabase Auth, enable email sign-ups, set the site URL, configure SMTP, and set the magic-link email template to show the code `{{ .Token }}`. Both apps use email one-time codes. Sign in once as the first staff user, copy their Supabase Auth user UUID into `ADMIN_USER_ID` in the root environment, and run `npm run migrate`. You can also run the migration before that step and rerun it after setting the UUID. The migration creates the isolated `bids` schema and adds the specified staff account.
4. Run `npm run dev` and open the URL printed by Next.js. Sign in with the staff email and open **Staff** to add notices, upload vehicle photos, set ETB prices and payment instructions, and verify submitted transaction references. The four subscription terms use calendar months. Blank prices disable plans.
5. Copy `mobile/.env.example` to `mobile/.env`. Set the API host, Supabase URL, and Supabase public key. Use a reachable HTTPS web host for a physical device. Run `npm run android` to start Metro for Android development. Use an Expo development or EAS preview build for push testing.
6. Configure Resend with a verified sender and set `RESEND_API_KEY`, `EMAIL_FROM`, and `WEB_URL` in the worker environment. For Android push, configure an Expo project and Firebase FCM credentials, set `EXPO_PUBLIC_EAS_PROJECT_ID` in the Android build, and supply the path to `google-services.json` as `GOOGLE_SERVICES_JSON` in the build environment. Set `EXPO_ACCESS_TOKEN` on the worker if Expo push security is enabled. Run `npm run worker` as a separate long-lived process.

## Public tender import

The worker starts with imports disabled. Confirm permission and obtain an official feed or a permitted adapter before setting `EGP_IMPORT_APPROVED=true` and an HTTPS `EGP_FEED_URL`. The adapter must return a JSON object with a `notices` array. Each notice uses `reference` or `sourceId`, `lot` if applicable, `title`, `issuer`, `region`, an ISO 8601 `deadline` with a numeric offset or Z, `status` of `active` or `cancelled`, and an official `sourceUrl`. Optional `description` carries the notice text in its original language. Provide `EGP_FEED_TOKEN` for a bearer-protected feed.

The hourly import applies updates and queues incomplete notices for staff review. Failed fetches and invalid envelopes leave published data in place. Staff can publish public notices manually while access is arranged. Include the official procurement reference and lot number on manual public listings to help the importer match them later.

## Verification and release

- `npm test` runs the API and worker integration tests using embedded PostgreSQL. The test notices and upload images are synthetic fixtures.
- `npm run build` builds the production website and API.
- From `mobile`, run `npx expo export --platform android` to check Android bundling. Use the EAS `preview` profile for a test APK once Expo and Firebase are configured.
- Before release, enter verified notices covering all four homepage sections, including used and damaged vehicles with authorized photos. Verify sign-in and email delivery, confirm a payment through the configured channel, and test push delivery and notification links on a physical Android device. Configure monitoring for worker logs, delivery failures, and the age of the last successful import.
- Deploy the Next.js service and worker with the same database and keep the worker running. The Android app uses an existing web-managed subscription after sign-in.

## Local vehicle design preview

Set `VEHICLE_REFERENCE_PREVIEW` in the web server environment to the absolute path of the supplied 720 × 720 GoBid reference PNG, then open `/vehicle-preview`. The attachment is read from that path for the preview. The route returns 404 when the variable is unset. Keep it unset on public deployments.

To show the Android preview button, set `EXPO_PUBLIC_VEHICLE_REFERENCE_PREVIEW=true` in the local mobile environment and point `EXPO_PUBLIC_API_URL` to the same preview server using a URL the device can reach.
