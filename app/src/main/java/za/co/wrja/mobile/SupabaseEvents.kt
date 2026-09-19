package za.co.wrja.mobile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private data class JudoEvent(
    val title: String,
    val description: String,
    val date: String,
    val startTime: String,
    val location: String,
    val registrationDeadline: String
)

private fun JSONObject.eventText(column: String): String {
    return if (isNull(column)) "" else optString(column, "")
}

private suspend fun fetchEvents(): List<JudoEvent> =
    withContext(Dispatchers.IO) {

        val address = SUPABASE_URL.trimEnd('/') +
                "/rest/v1/events" +
                "?select=id,title,description,event_date,start_time," +
                "location,registration_deadline" +
                "&event_status=eq.published" +
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
                .bufferedReader()
                .use { it.readText() }

            val rows = JSONArray(response)

            List(rows.length()) { index ->
                val row = rows.getJSONObject(index)

                JudoEvent(
                    title = row.eventText("title"),
                    description = row.eventText("description"),
                    date = row.eventText("event_date"),
                    startTime = row.eventText("start_time").take(5),
                    location = row.eventText("location"),
                    registrationDeadline =
                        row.eventText("registration_deadline")
                )
            }
        } finally {
            connection.disconnect()
        }
    }

@Composable
fun SupabaseEvents() {
    var events by remember {
        mutableStateOf<List<JudoEvent>>(emptyList())
    }

    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var refreshCount by remember { mutableStateOf(0) }

    LaunchedEffect(refreshCount) {
        loading = true
        error = null

        try {
            events = fetchEvents()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            error = if (failure is IllegalStateException) {
                failure.message ?: "Unable to load events."
            } else {
                "Could not connect. Check your internet connection and retry."
            }
        } finally {
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        when {
            loading -> {
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(12.dp))
                Text("Loading events…")
            }

            error != null -> {
                Text(
                    text = error ?: "Unable to load events.",
                    color = MaterialTheme.colorScheme.error
                )
            }

            events.isEmpty() -> {
                Text("No published events are available yet.")
            }

            else -> {
                events.forEach { event ->
                    Card(
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
                            Text("Date: ${event.date}")

                            if (event.startTime.isNotBlank()) {
                                Text("Time: ${event.startTime}")
                            }

                            if (event.location.isNotBlank()) {
                                Text("Location: ${event.location}")
                            }

                            if (event.description.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(event.description)
                            }

                            if (event.registrationDeadline.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "Registration closes: " +
                                            event.registrationDeadline
                                )
                            }
                        }
                    }
                }
            }
        }

        if (!loading) {
            TextButton(onClick = { refreshCount++ }) {
                Text(if (error == null) "Refresh" else "Retry")
            }
        }
    }
}