# WRJA Mobile — Android

The West Rand Judo Association (WRJA) Android app gives members and families access to club information, competition details, news, and support. This is the **`app` branch**; the public website and admin dashboard are maintained separately in the repository's website branches.

## What the app does

| Area | Features |
| --- | --- |
| Account | Register as an athlete or parent/guardian, sign in, reset a password by email, and manage member profile details. **Remember me** allows a remembered session to be unlocked with an enrolled fingerprint. |
| Club information | Browse Home, About, instructors and affiliated clubs, Programs, News, Gallery, FAQs, and club contact details. |
| Events | Browse standard events, the competition calendar, competitions, and schools events. View event details and follow published registration links. |
| Payments and store | View EFT instructions, upload payment proof, and check its review status. The app does not process a bank payment itself. Store products are handled by enquiry rather than checkout. |
| Contact | Send messages to the website's admin inbox. Offline enquiries are queued on the device and synchronised when a connection returns. |
| Chat Assistant | Uses the same live assistant API as the website and sends bounded conversation history for follow-up questions. If the API is unavailable, the app labels and uses its built-in offline replies. |
| Notifications and accessibility | Opt in to club updates, change between English, Afrikaans, and isiZulu, and use layouts that adapt to screen width and text size. Server-authored content stays in its original language. |

## Build and run

- Android Studio, **JDK 21**, and **Android SDK 35** are required to build. The app supports Android 7.0 (API 24) and later. The application ID is `za.co.wrja.mobile`.
- The Android build uses the Gradle wrapper, Kotlin, Jetpack Compose, and Material 3. npm and the generated `node_modules` folder are not required for the Android build.

```sh
git clone --branch app --single-branch https://github.com/JuniorMalinga/West_Rand_Judo_Association_WRJA-Website.git
cd West_Rand_Judo_Association_WRJA-Website
```

Open the cloned folder in Android Studio, select JDK 21 as the Gradle JDK, and sync. Select the **app** run configuration and an emulator or connected Android device, then click **Run**.

On Windows, from the project root:

```powershell
.\gradlew.bat :app:assembleDebug
.\gradlew.bat :app:assembleDebugAndroidTest
.\gradlew.bat :app:connectedDebugAndroidTest
```

The third command requires a connected device or emulator. To install without Android Studio on the device, transfer `app/build/outputs/apk/debug/app-debug.apk` to your phone or tablet, open it in the file manager, and install it. Only allow installation from a source you trust.

## Services and data

- **Supabase** provides authentication, member and event data, and payment-proof storage. The app uses public client configuration; privileged keys belong on the server. Remembered session credentials are encrypted locally using Android Keystore.
- **WRJA website API** handles password reset, Contact submissions, and chat. The website admin dashboard is where admins review Contact messages and payment proofs. A successful chat response can come from the website's own knowledge base or its AI service; the Android app does not store a provider API key.
- **SQLite + WorkManager** store and retry queued Contact enquiries. If a request may already have reached the website, the app flags uncertain delivery rather than silently sending it again. Check the outbox or confirmation email before resubmitting.
- **Firebase Cloud Messaging** handles push notifications only; it does not replace Supabase. The WRJA Android client configuration is at `app/google-services.json`. For a debug test, enable notifications in the app drawer, allow Android notifications, and use **Copy test device token** with Firebase Console's **Send test message**. Use the token from the device being tested and keep it private. Website event and news updates do not automatically trigger pushes; announcements are sent manually through Firebase Console.

## Device test checklist

1. On a phone and tablet, check portrait and landscape, larger text, the keyboard on forms, and gallery captions and controls.
2. Verify registration validation, password reset, language switching, and fingerprint unlock after reopening a remembered session.
3. Ask the chatbot a follow-up online, then disconnect and verify the labelled offline response.
4. With admin approval and test data, queue a Contact enquiry offline, reconnect, and verify delivery in the admin inbox. Check EFT proof status and Firebase test delivery separately.

Use a test account. Live Contact submissions and payment-proof uploads can reach the WRJA admin dashboard. See [Advanced features and acceptance checks](ADVANCED_FEATURES.md) for configuration and testing details.
