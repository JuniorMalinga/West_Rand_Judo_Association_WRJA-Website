package za.co.wrja.mobile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import coil.compose.AsyncImage
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

internal data class JudoEvent(
    val id: String,
    val title: String,
    val description: String,
    val date: String,
    val startTime: String,
    val location: String,
    val registrationDeadline: String,
    val registrationUrl: String,
    val qrCode: String,
    val paymentRequired: Boolean
)

enum class EventListKind(val query: String) {
    STANDARD("&event_type=neq.competition"),
    COMPETITIONS("&event_type=eq.competition&slug=not.like.sa-schools-*"),
    SCHOOLS("&event_type=eq.competition&slug=like.sa-schools-*")
}

private fun JSONObject.eventText(column: String): String {
    return if (isNull(column)) "" else optString(column, "")
}

internal suspend fun fetchEvents(kind: EventListKind?, eventId: String? = null): List<JudoEvent> =
    withContext(Dispatchers.IO) {

        val address = SUPABASE_URL.trimEnd('/') +
                "/rest/v1/events" +
                "?select=id,title,description,event_date,start_time," +
                "location,registration_deadline,entry_form_path,registration_url,qr_code_image_path,payment_required" +
                "&event_status=eq.published" + kind?.query.orEmpty() +
                (eventId?.let { "&id=eq.${android.net.Uri.encode(it)}" } ?: "") +
                "&order=event_date.asc,id.asc"

        val connection =
            URL(address).openConnection() as HttpURLConnection

        try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.instanceFollowRedirects = false

            connection.setRequestProperty("apikey", SUPABASE_KEY)
            connection.setRequestProperty("Accept", "application/json")

            val status = connection.responseCode

            if (status != HttpURLConnection.HTTP_OK) {
                val message = when (status) {
                    401, 403 ->
                        "Access denied. Check the events read policy."

                    404 ->
                        "The events table or project address was not found."

                    else ->
                        "Supabase returned HTTP $status."
                }

                throw IllegalStateException(message)
            }

            val response = connection.inputStream
                .readBoundedText()

            val rows = JSONArray(response)

            List(rows.length()) { index ->
                val row = rows.getJSONObject(index)

                JudoEvent(
                    id = row.eventText("id"),
                    title = row.eventText("title"),
                    description = row.eventText("description"),
                    date = row.eventText("event_date"),
                    startTime = row.eventText("start_time").take(5),
                    location = row.eventText("location"),
                    registrationDeadline =
                        row.eventText("registration_deadline"),
                    registrationUrl = row.eventText("registration_url").ifBlank { row.eventText("entry_form_path") },
                    qrCode = row.eventText("qr_code_image_path"),
                    paymentRequired = row.optBoolean("payment_required")
                )
            }
        } finally {
            connection.disconnect()
        }
    }

@Composable
fun SupabaseEvents(kind: EventListKind? = null, onPayment: ((String) -> Unit)? = null) {
    var events by remember {
        mutableStateOf<List<JudoEvent>>(emptyList())
    }

    var selectedEvent by remember { mutableStateOf<JudoEvent?>(null) }

    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var refreshCount by remember { mutableStateOf(0) }

    val loadFailure = loadFailureMessage()
    LaunchedEffect(refreshCount, kind) {
        loading = true
        error = null

        try {
            events = fetchEvents(kind)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            error = actionFailure("Load events", failure, loadFailure)
        } finally {
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        when {
            loading -> {
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(12.dp))
                Text(localized("Loading events…", "Geleenthede word gelaai…", "Kulayishwa imicimbi…"))
            }

            error != null -> {
                Text(
                    text = error ?: localized("Unable to load events.", "Kon nie geleenthede laai nie.", "Ayikwazanga ukulayisha imicimbi."),
                    color = MaterialTheme.colorScheme.error
                )
            }

            events.isEmpty() -> {
                Text(localized("No published events are available yet.", "Geen gepubliseerde geleenthede is nog beskikbaar nie.", "Akukho micimbi eshicilelwe etholakalayo okwamanje."))
            }

            else -> {
                events.forEach { event ->
                    Card(
                        onClick = { selectedEvent = event },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = event.title,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )

                            Spacer(modifier = Modifier.height(8.dp))
                            Text("${localized("Date", "Datum", "Usuku")}: ${event.date}")

                            if (event.startTime.isNotBlank()) {
                                Text("${localized("Time", "Tyd", "Isikhathi")}: ${event.startTime}")
                            }

                            if (event.location.isNotBlank()) {
                                Text("${localized("Location", "Plek", "Indawo")}: ${event.location}")
                            }

                            if (event.description.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(event.description)
                            }

                            if (event.registrationDeadline.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "${localized("Registration closes", "Registrasie sluit", "Ukubhalisa kuyavalwa")}: " +
                                            event.registrationDeadline
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                localized("VIEW EVENT DETAILS  →", "BEKYK GELEENTHEIDSBESONDERHEDE  →", "BONA IMINININGWANE YOMCIMBI  →"),
                                color = MaterialTheme.colorScheme.primary,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        if (!loading) {
            TextButton(onClick = { refreshCount++ }) {
                Text(if (error == null) localized("Refresh", "Verfris", "Vuselela") else localized("Retry", "Probeer weer", "Zama futhi"))
            }
        }
    }

    selectedEvent?.let { event ->
        EventDetailsDialog(event, onDismiss = { selectedEvent = null }, onPayment = onPayment)
    }
}

@Composable
internal fun EventDetailsDialog(event: JudoEvent, onDismiss: () -> Unit, onPayment: ((String) -> Unit)?) {
    val context = LocalContext.current
    AlertDialog(
        onDismissRequest = { onDismiss() },
        title = { Text(event.title, fontWeight = FontWeight.Bold) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                Text("${localized("Date", "Datum", "Usuku")}: ${event.date}")
                if (event.startTime.isNotBlank()) Text("${localized("Time", "Tyd", "Isikhathi")}: ${event.startTime}")
                if (event.location.isNotBlank()) Text("${localized("Location", "Plek", "Indawo")}: ${event.location}")
                if (event.registrationDeadline.isNotBlank()) {
                    Spacer(Modifier.height(8.dp))
                    Text("${localized("Registration closes", "Registrasie sluit", "Ukubhalisa kuyavalwa")}: ${event.registrationDeadline}")
                }
                if (event.description.isNotBlank()) {
                    Spacer(Modifier.height(12.dp))
                    Text(event.description)
                }
                if (event.qrCode.isNotBlank()) {
                    val url = publicMediaUrl(event.qrCode)
                    var qrFailed by remember(url) { mutableStateOf(false) }
                    if (url != null && !qrFailed) {
                        AsyncImage(model = url, contentDescription = "Registration QR code", modifier = Modifier.fillMaxWidth().height(160.dp), onError = { qrFailed = true })
                    } else {
                        Text(localized("The registration QR code could not load. Use the registration link if available.", "Die registrasie-QR-kode kon nie laai nie. Gebruik die registrasieskakel indien beskikbaar.", "Ikhodi ye-QR yokubhalisa ayilayishwanga. Sebenzisa isixhumanisi sokubhalisa uma sikhona."), color = MaterialTheme.colorScheme.error)
                    }
                }
                if (event.registrationUrl.isNotBlank()) {
                    TextButton(onClick = { openPublicWebsite(context, event.registrationUrl) }) {
                        Text(localized("Open registration", "Maak registrasie oop", "Vula ukubhalisa"))
                    }
                } else {
                    Text(localized("No registration link has been published.", "Geen registrasieskakel is gepubliseer nie.", "Asikho isixhumanisi sokubhalisa esishicilelwe."))
                }
                if (event.paymentRequired && onPayment != null) {
                    TextButton(onClick = { onDismiss(); onPayment(event.id) }) {
                        Text(localized("Payment details / Upload proof", "Betalingsbesonderhede / Laai bewys op", "Imininingwane yenkokhelo / Layisha ubufakazi"))
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onDismiss() }) { Text(localized("Close", "Sluit", "Vala")) }
        }
    )
}
