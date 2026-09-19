package za.co.wrja.mobile

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
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

private data class AboutEntry(
    val title: String,
    val details: List<String>
)

private fun JSONObject.aboutText(column: String): String {
    return if (isNull(column)) "" else optString(column, "")
}

private suspend fun fetchAboutEntries(
    table: String
): List<AboutEntry> = withContext(Dispatchers.IO) {

    val query = when (table) {
        "instructors" ->
            "select=id,first_name,last_name,rank,bio," +
                    "qualifications,specialisations" +
                    "&is_active=eq.true" +
                    "&order=display_order.asc.nullslast,id.asc"

        "clubs" ->
            "select=id,name,description,address,phone,email,website_url" +
                    "&is_active=eq.true" +
                    "&order=name.asc,id.asc"

        else -> error("Unsupported About table.")
    }

    val address = SUPABASE_URL.trimEnd('/') +
            "/rest/v1/$table?$query"

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
                    "Access denied. Check the $table read policy."

                404 ->
                    "The $table table or project address was not found."

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

            if (table == "instructors") {
                AboutEntry(
                    title = listOf(
                        row.aboutText("first_name"),
                        row.aboutText("last_name")
                    ).filter { it.isNotBlank() }
                        .joinToString(" "),

                    details = listOf(
                        row.aboutText("rank"),
                        row.aboutText("bio"),

                        row.aboutText("qualifications").let {
                            if (it.isBlank()) "" else "Qualifications: $it"
                        },

                        row.aboutText("specialisations").let {
                            if (it.isBlank()) "" else "Specialisations: $it"
                        }
                    ).filter { it.isNotBlank() }
                )
            } else {
                AboutEntry(
                    title = row.aboutText("name"),

                    details = listOf(
                        row.aboutText("description"),

                        row.aboutText("address").let {
                            if (it.isBlank()) "" else "Address: $it"
                        },

                        row.aboutText("phone").let {
                            if (it.isBlank()) "" else "Phone: $it"
                        },

                        row.aboutText("email").let {
                            if (it.isBlank()) "" else "Email: $it"
                        },

                        row.aboutText("website_url").let {
                            if (it.isBlank()) "" else "Website: $it"
                        }
                    ).filter { it.isNotBlank() }
                )
            }
        }
    } finally {
        connection.disconnect()
    }
}

@Composable
fun SupabaseAbout() {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "OUR INSTRUCTORS",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(12.dp))

        AboutDataSection(
            table = "instructors",
            emptyMessage = "No instructors are available yet."
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "AFFILIATED CLUBS",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(12.dp))

        SupabaseClubs()
    }
}

// Reusable for the Contact screen in the next step.
@Composable
fun SupabaseClubs() {
    AboutDataSection(
        table = "clubs",
        emptyMessage = "No clubs are available yet."
    )
}

@Composable
private fun AboutDataSection(
    table: String,
    emptyMessage: String
) {
    var entries by remember(table) {
        mutableStateOf<List<AboutEntry>>(emptyList())
    }

    var loading by remember(table) { mutableStateOf(true) }
    var error by remember(table) { mutableStateOf<String?>(null) }
    var refreshCount by remember(table) { mutableStateOf(0) }

    LaunchedEffect(table, refreshCount) {
        loading = true
        error = null

        try {
            entries = fetchAboutEntries(table)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            error = if (failure is IllegalStateException) {
                failure.message ?: "Unable to load $table."
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
                Text("Loading $table…")
            }

            error != null -> {
                Text(
                    text = error ?: "Unable to load $table.",
                    color = MaterialTheme.colorScheme.error
                )
            }

            entries.isEmpty() -> {
                Text(emptyMessage)
            }

            else -> {
                entries.forEach { entry ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = entry.title,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )

                            entry.details.forEach { detail ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(detail)
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