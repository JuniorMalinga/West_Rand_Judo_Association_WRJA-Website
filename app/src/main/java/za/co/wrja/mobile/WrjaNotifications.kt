package za.co.wrja.mobile

import android.Manifest
import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.*

private inline fun guardNotification(operation: String, onFailure: () -> Unit = {}, block: () -> Unit) {
    try { block() } catch (failure: Exception) {
        reportFailure(operation, failure)
        onFailure()
    }
}

class WrjaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        guardNotification("Create notification channel") {
            if (Build.VERSION.SDK_INT >= 26) {
                getSystemService(NotificationManager::class.java)?.createNotificationChannel(
                    NotificationChannel("wrja_updates", "WRJA updates", NotificationManager.IMPORTANCE_DEFAULT)
                )
            }
        }
        // WorkManager persists work across process death and device restarts.
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            val pending = recoverOperation("Read pending enquiries on startup", { emptyList() }) {
                ContactOutbox(this@WrjaApplication).use { it.pendingEntries() }
            }
            pending.forEach { entry ->
                recoverOperation("Restore enquiry sync", {}) {
                    ContactOutbox.schedule(this@WrjaApplication, entry.id)
                }
            }
        }
        guardNotification("Restore notifications") {
            if (FirebaseApp.getApps(this).isNotEmpty() && getSharedPreferences("push", MODE_PRIVATE).getBoolean("enabled", false)) {
                subscribeInBackground()
            }
        }
    }
}

private fun subscribeInBackground() {
    FirebaseMessaging.getInstance().subscribeToTopic("wrja-public-updates")
        .addOnFailureListener { reportFailure("Restore club subscription", it) }
}

/** Public club announcements only. Private member information must not use a topic. */
class WrjaMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // FCM handles token rotation for topic subscriptions; never log tokens.
        guardNotification("Refresh notification subscription") {
            if (getSharedPreferences("push", MODE_PRIVATE).getBoolean("enabled", false)) subscribeInBackground()
        }
    }
    override fun onMessageReceived(message: RemoteMessage) = guardNotification("Display notification") {
        if (!getSharedPreferences("push", MODE_PRIVATE).getBoolean("enabled", false)) return@guardNotification
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return@guardNotification
        val language = LanguageStore.read(this).code
        val title = message.data["title_$language"] ?: message.notification?.title ?: message.data["title"] ?: "WRJA"
        val body = message.data["body_$language"] ?: message.notification?.body ?: message.data["body"].orEmpty()
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(this, "wrja_updates")
            .setSmallIcon(R.drawable.ic_wrja_mark).setContentTitle(title).setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body)).setContentIntent(open).setAutoCancel(true).build()
        NotificationManagerCompat.from(this).notify(message.messageId?.hashCode() ?: System.currentTimeMillis().toInt(), notification)
    }
}

@Composable
fun PushNotificationSettings() {
    val context = LocalContext.current
    val initialSettings = remember(context) {
        try {
            val prefs = context.getSharedPreferences("push", android.content.Context.MODE_PRIVATE)
            prefs to prefs.getBoolean("enabled", false)
        } catch (failure: Exception) {
            reportFailure("Read notification settings", failure)
            null
        }
    }
    var enabled by remember { mutableStateOf(initialSettings?.second == true) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(initialSettings == null) }
    var testTokenCopied by remember { mutableStateOf(false) }
    val configured = remember { FirebaseApp.getApps(context).isNotEmpty() }
    fun showFailure() {
        busy = false
        error = true
    }
    fun updateSubscription(target: Boolean) {
        val preferences = initialSettings?.first ?: return
        if (!configured || busy) return
        busy = true
        guardNotification("Update club subscription", ::showFailure) {
            val messaging = FirebaseMessaging.getInstance()
            val task = if (target) messaging.subscribeToTopic("wrja-public-updates")
                else messaging.unsubscribeFromTopic("wrja-public-updates")
            task.addOnCompleteListener { result ->
                guardNotification("Save club subscription", ::showFailure) {
                    if (result.isSuccessful) {
                        preferences.edit().putBoolean("enabled", target).apply()
                        enabled = target
                        busy = false
                        error = false
                    } else {
                        result.exception?.let { reportFailure("Update club subscription", it) }
                        showFailure()
                    }
                }
            }
        }
    }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) updateSubscription(true) else showFailure()
    }
    Column(Modifier.fillMaxWidth().padding(horizontal = 22.dp, vertical = 12.dp)) {
        Text(localized("Club notifications", "Klubkennisgewings", "Izaziso zeklabhu"), color = WrjaGold)
        Text(if (!configured) localized("Push notifications await Firebase project setup.", "Stootkennisgewings wag op Firebase-projekopstelling.", "Izaziso zilinde ukusethwa kwephrojekthi ye-Firebase.") else localized("Receive public WRJA announcements.", "Ontvang openbare WRJA-aankondigings.", "Thola izimemezelo zomphakathi ze-WRJA."), style = MaterialTheme.typography.bodySmall)
        if (error) Text(localized("Check notification permission and your connection, then retry.", "Gaan kennisgewingtoestemming en jou verbinding na, en probeer weer.", "Hlola imvume yezaziso noxhumano bese uzama futhi."), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        TextButton(enabled = configured && initialSettings != null && !busy, onClick = {
            error = false
            if (enabled) {
                updateSubscription(false)
            } else if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                guardNotification("Request notification permission", ::showFailure) {
                    permission.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            } else updateSubscription(true)
        }) {
            Text(if (busy) localized("Please wait…", "Wag asseblief…", "Linda…") else if (enabled) localized("Disable notifications", "Deaktiveer kennisgewings", "Vala izaziso") else localized("Enable notifications", "Aktiveer kennisgewings", "Vula izaziso"))
        }
        // Explicit user action only; never log the device registration token or
        // expose it in release builds. This is not an FCM server credential.
        if (BuildConfig.DEBUG && configured && enabled) {
            TextButton(enabled = !busy, onClick = {
                busy = true
                error = false
                testTokenCopied = false
                guardNotification("Get test token", ::showFailure) {
                    FirebaseMessaging.getInstance().token.addOnCompleteListener { result ->
                        guardNotification("Copy test token", ::showFailure) {
                            val token = if (result.isSuccessful) result.result else null
                            val clipboard = context.getSystemService(android.content.ClipboardManager::class.java)
                            if (!token.isNullOrBlank() && clipboard != null) {
                                clipboard.setPrimaryClip(android.content.ClipData.newPlainText("FCM test device token", token))
                                testTokenCopied = true
                                busy = false
                            } else showFailure()
                        }
                    }
                }
            }) { Text(localized("Copy test device token", "Kopieer toetstoestel-token", "Kopisha ithokheni yedivayisi yokuhlola")) }
            if (testTokenCopied) Text(localized("Copied. Paste into Firebase Console's test-message device field. Do not share publicly.", "Gekopieer. Plak in Firebase Console se toetsboodskap-toestelveld. Moenie openbaar deel nie.", "Kukopishiwe. Namathisela enkambini yedivayisi yomlayezo wokuhlola ku-Firebase Console. Ungabelani ngayo esidlangalaleni."), style = MaterialTheme.typography.bodySmall)
        }
    }
}
