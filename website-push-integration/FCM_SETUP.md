# Automatic WRJA event/news alerts (production backend)

## Deployment confirmed

`vercel.json` rewrites `/api/*` to `api/index.js`, which exports `backend/src/server.js`. The deployed `/api/health` endpoint also responds with `Server: Vercel` and `X-Vercel-Id`. The downloaded folder is a source snapshot, not a connected Git checkout; deploy these changes through the website's real production repository/project, not the Android `app` branch.

## Trigger behaviour

Admin POST creation routes for standard events, competitions, school competitions and news now await `saveAndNotify`. The existing save publishes these records immediately. A push is attempted only after that save succeeds. PUT edits, DELETE requests, failed validation and failed database writes do not send alerts. No old records are broadcast when the app/server starts.

FCM HTTP v1 targets `wrja-public-updates` in Firebase project `wrja-project`. Public content titles are retained in their authored language. Headings have English, Afrikaans and isiZulu variants; Android chooses its saved language. Supabase remains the database.

The admin create response includes `notification.status`: `accepted` (Google accepted the request, not proof of delivery to every device), `disabled`, or `failed`. Notification failures never undo a saved record. Do not recreate a publication just to retry a failed alert. This integration deliberately has no automatic push retries on ambiguous failures, because FCM does not promise exactly-once delivery. Ordinary edits do not resend. A durable transactional notification outbox is a separate enhancement if guaranteed processing/retry is needed.

The sender is awaited before returning the HTTP response: no in-memory timers, background subscriptions, or fire-and-forget work that Vercel might stop. OAuth and FCM each have an 8-second timeout. Warm function instances cache short-lived OAuth access tokens. There are no new npm dependencies; Node 20+ supplies fetch, crypto and AbortSignal.timeout.

## What the project owner must configure

1. In Firebase Console select **WRJA Project** (`wrja-project`) > **Project settings > Service accounts**. If using a downloadable key, select **Generate new private key**. Keep this JSON file private on your computer; it is NOT `google-services.json` and must never go in Android, frontend code, Git or chat. Prefer a dedicated least-privileged service account with Firebase Cloud Messaging API Admin permission for this project rather than a broadly privileged key.
2. In the corresponding Google Cloud project confirm **Firebase Cloud Messaging API** (HTTP v1) is enabled. The Firebase Console test already established working client delivery, but the backend service identity must also have permission to send.
3. Open the website's **Vercel project > Settings > Environment Variables**. Add these for **Production**, using the matching properties from the private service-account JSON:

   | Variable | Value |
   | --- | --- |
   | `FCM_NOTIFICATIONS_ENABLED` | `true` |
   | `FIREBASE_PROJECT_ID` | `wrja-project` (the key file's `project_id`) |
   | `FIREBASE_CLIENT_EMAIL` | The key file's `client_email` |
   | `FIREBASE_PRIVATE_KEY` | The complete `private_key`, including BEGIN/END lines; real newlines or literal `\n` are supported |

   Never prefix these with `VITE_`: that would risk exposing them to the browser. Leave preview/development notifications disabled so test publications do not broadcast to production users. Missing/disabled configuration does not stop content publishing.
4. Merge/deploy the changed website files to the branch connected to the Vercel production project, then redeploy after setting environment variables. Editing a downloaded folder does not update the live website. Verify the Vercel project actually points to the intended production branch; the local configuration alone cannot reveal that dashboard setting.
5. On the phone enable Club notifications. Publish one intentional event/news article through the website admin. Confirm the API response has `notification.status = accepted` and the phone receives the alert in foreground and background. Check that editing the same record causes no new alert. Do not publish test content to all subscribers without considering the audience.

## Verification

`node --test backend/tests/push-notifications.test.js` uses generated temporary test keys and mocked network responses; it does not contact Google, send notifications, or touch Supabase. Run the website's full `npm test` from `backend` after installing its normal dependencies, and build the frontend before deployment.

Server authentication is not an Android code change. The Android test-token copy button is for development only; never put a device token or Firebase service key in this documentation.

References: https://firebase.google.com/docs/cloud-messaging/send/v1-api and https://developers.google.com/identity/protocols/oauth2/service-account
