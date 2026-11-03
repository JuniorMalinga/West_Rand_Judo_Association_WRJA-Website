# Advanced features — implementation and acceptance checklist

## Requirement audit

| Requirement | Implementation | Remaining verification/setup |
| --- | --- | --- |
| Native biometrics | Existing AndroidX BiometricPrompt, strong authentication and enrolled fingerprint checks; remembered refresh tokens now encrypted with a device-local Android Keystore AES-GCM key | Test successful/cancelled/unenrolled fingerprint cases on the Pixel 7. This is remembered-session unlocking, not account registration by fingerprint. |
| Offline + sync using SQLite/Room | Contact enquiry SQLite outbox + network-constrained persistent WorkManager jobs | Test airplane mode, process restart, reconnect, and successful admin inbox delivery. |
| FCM live notifications | FirebaseMessagingService, notification channel, Android 13+ permission, public-topic opt-in/out in drawer, localized data payload support | **Not yet live:** requires your Firebase Android configuration and a trusted sender; no credentials were supplied. |
| Two official SA languages | English, Afrikaans and isiZulu; persisted login/drawer selection and Compose text | Human language review is advisable; user-generated and server-authored content remains in its original language. |
| Production assets | Bundled WRJA photos; custom black/gold vector launcher mark with adaptive, monochrome and legacy variants | Check launcher masking and image presentation on the target phone. |

Supabase remains the database/authentication provider. Firebase is used **only** for Cloud Messaging; no Firebase Database or Firestore dependency is introduced.

## Offline enquiries

Submit an enquiry on Contact while offline. A local acknowledgement means **queued**, not delivered. The outbox shows queued, sending, delivered (with/without confirmation email), rejected, or uncertain delivery. Requests go to the existing production `/api/messages` endpoint when Android permits network work. Background scheduling is eventual, not an immediate-delivery guarantee. Android force-stop prevents background work until the app is reopened.

Network-unavailable connection failures and rate limits retry with backoff. A timeout, server error, process interruption or ambiguous response after submission is held for review because the website endpoint does not implement idempotency. Check email/admin before manually submitting again. Exactly-once automatic retry after ambiguous failures requires a server-side unique request ID contract; this app does not pretend the existing backend has one.

Pending enquiry data is app-private SQLite data and is not backed up. Delivered rows retain status only: names, addresses, phone and message contents are cleared. Remove from device cancels queued work or removes a local status; it cannot recall delivered mail. The outbox is device-scoped (public contact requests), not a private member inbox.

## Enable actual FCM delivery

1. Create/select the WRJA Firebase project. Add an Android app with package **za.co.wrja.mobile**. This does not change the existing Supabase project.
2. Download its **Android client** `google-services.json` and place it at `app/google-services.json`. Do not use a service-account/admin private-key file here. Gradle applies the Google Services plugin only when that client configuration exists.
3. Sync, rebuild and install on an emulator/device with Google Play services. Sign in, open the drawer, and enable club notifications. Grant Android's notification permission.
4. Use Firebase Notifications Composer to send a test notification to topic **wrja-public-updates**, or send through the Firebase Admin SDK / FCM HTTP v1 from a trusted backend with the appropriate project credentials. Never embed service-account keys or server OAuth tokens in the APK.
5. For automatic event/news alerts, your backend must send to that topic **after a successful publish**, once per publication. This repository does not contain or modify the website production backend. Its existing admin screens do not automatically publish FCM messages just because the Android receiver exists.
6. Test foreground, background, tap-to-open, disabled permission, opt-out, and offline/reconnect. FCM depends on connectivity and OS delivery policies; it is not a guaranteed instant alarm service.

Public topic notifications must contain public club information only. Do not send private member/account information to a public topic. A topic is not an authorization boundary.

For multilingual notifications prefer a data payload, with server-supplied `title_en`, `body_en`, `title_af`, `body_af`, `title_zu`, `body_zu`. The app chooses the saved language; `title` and `body` are fallbacks. Notification payloads shown directly by Android while backgrounded use the text provided by the sender.

## Tests

- `gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest` builds the app and instrumentation tests.
- With a connected test device: `gradlew.bat :app:connectedDebugAndroidTest` exercises SQLite persistence/uncertain replay protection, payload clearing, Keystore encryption and language persistence. Tests use a separate temporary database and do not send real enquiries or emails.
- Manual acceptance: sign in with Remember me, restart, unlock by fingerprint; change language; send one enquiry offline; reopen; reconnect and verify exactly one admin message plus confirmation; test configured FCM in foreground/background.

## References

- [Android biometric authentication](https://developer.android.com/identity/sign-in/biometric-auth)
- [Persistent work constraints/retries](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work)
- [FCM Android receive messages](https://firebase.google.com/docs/cloud-messaging/android/receive-messages)
