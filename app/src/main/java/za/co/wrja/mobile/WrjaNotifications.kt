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

class WrjaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= 26) {
            getSystemService(NotificationManager::class.java).createNotificationChannel(
                NotificationChannel("wrja_updates", "WRJA updates", NotificationManager.IMPORTANCE_DEFAULT)
            )
        }
        // WorkManager persists work across process death and device restarts.
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            ContactOutbox(this@WrjaApplication).use { db ->
                db.entries().forEach {
                    if (it.status == "queued" || it.status == "sending") ContactOutbox.schedule(this@WrjaApplication, it.id)
                }
            }
        }
        if (FirebaseApp.getApps(this).isNotEmpty() && getSharedPreferences("push", MODE_PRIVATE).getBoolean("enabled", false)) {
            FirebaseMessaging.getInstance().subscribeToTopic("wrja-public-updates")
        }
    }
}

/** Public club announcements only. Private member information must not use a topic. */
class WrjaMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // FCM handles token rotation for topic subscriptions; never log tokens.
        if (getSharedPreferences("push", MODE_PRIVATE).getBoolean("enabled", false)) {
            FirebaseMessaging.getInstance().subscribeToTopic("wrja-public-updates")
        }
    }
    override fun onMessageReceived(message: RemoteMessage) {
        if (!getSharedPreferences("push", MODE_PRIVATE).getBoolean("enabled", false)) return
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
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
    val preferences = remember { context.getSharedPreferences("push", android.content.Context.MODE_PRIVATE) }
    var enabled by remember { mutableStateOf(preferences.getBoolean("enabled", false)) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    val configured = remember { FirebaseApp.getApps(context).isNotEmpty() }
    fun subscribe() {
        if (!configured) return
        busy = true
        FirebaseMessaging.getInstance().subscribeToTopic("wrja-public-updates").addOnCompleteListener {
            busy = false; error = !it.isSuccessful
            if (it.isSuccessful) { enabled = true; preferences.edit().putBoolean("enabled", true).apply() }
        }
    }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) subscribe() else error = true
    }
    Column(Modifier.fillMaxWidth().padding(horizontal = 22.dp, vertical = 12.dp)) {
        Text(localized("Club notifications", "Klubkennisgewings", "Izaziso zeklabhu"), color = WrjaGold)
        Text(if (!configured) localized("Push notifications await Firebase project setup.", "Stootkennisgewings wag op Firebase-projekopstelling.", "Izaziso zilinde ukusethwa kwephrojekthi ye-Firebase.") else localized("Receive public WRJA announcements.", "Ontvang openbare WRJA-aankondigings.", "Thola izimemezelo zomphakathi ze-WRJA."), style = MaterialTheme.typography.bodySmall)
        if (error) Text(localized("Check notification permission and your connection, then retry.", "Gaan kennisgewingtoestemming en jou verbinding na, en probeer weer.", "Hlola imvume yezaziso noxhumano bese uzama futhi."), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        TextButton(enabled = configured && !busy, onClick = {
            error = false
            if (enabled) {
                busy = true
                FirebaseMessaging.getInstance().unsubscribeFromTopic("wrja-public-updates").addOnCompleteListener {
                    busy = false; error = !it.isSuccessful
                    if (it.isSuccessful) { enabled = false; preferences.edit().putBoolean("enabled", false).apply() }
                }
            } else if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permission.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else subscribe()
        }) {
            Text(if (busy) localized("Please wait…", "Wag asseblief…", "Linda…") else if (enabled) localized("Disable notifications", "Deaktiveer kennisgewings", "Vala izaziso") else localized("Enable notifications", "Aktiveer kennisgewings", "Vula izaziso"))
        }
    }
}
