package za.co.wrja.mobile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.Image
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

internal const val SUPABASE_URL =
    "https://fgisqtkrznemwtfakfky.supabase.co"

internal const val SUPABASE_KEY =
    "sb_publishable_nAYh_Xw-I-LGiuYY9IsJrA_mWVXCRxc"

private data class JudoProgram(
    val name: String,
    val description: String,
    val ageGroup: String,
    val schedule: String
)

private fun programPhoto(name: String): Int = when {
    name.contains("kid", ignoreCase = true) -> R.drawable.kids_judo
    name.contains("women", ignoreCase = true) -> R.drawable.womens_judo
    else -> R.drawable.adult_judo
}

private val websitePrograms = listOf(
    JudoProgram("Kids Judo", "Our kids' programme introduces judo through structured, age-appropriate coaching in a safe and supportive environment. Athletes learn balance, safe falling and basic technique while building discipline, respect and confidence.", "Children and young athletes", "Contact your preferred club for current sessions."),
    JudoProgram("Adult Judo", "Built for every level, from complete beginners to competitive judoka. Training covers standing technique (tachi-waza), groundwork (ne-waza) and competition-focused conditioning.", "All grades welcome", "Contact your preferred club for current sessions."),
    JudoProgram("Women's Judo", "A dedicated, welcoming space to train, compete and grow. Sessions build technical development, fitness, confidence and self-defence skills in a supportive club community.", "Women and girls", "Contact your preferred club for current sessions.")
)

private fun JSONObject.readText(column: String): String {
    return if (isNull(column)) "" else optString(column, "")
}

private suspend fun fetchPrograms(): List<JudoProgram> =
    withContext(Dispatchers.IO) {

        check(
            !SUPABASE_URL.contains("YOUR_PROJECT_REF") &&
                    !SUPABASE_KEY.contains("REPLACE_WITH_YOUR_KEY")
        ) {
            "Add your Supabase URL and publishable key first."
        }

        check(SUPABASE_KEY.startsWith("sb_publishable_")) {
            "Use the Supabase publishable key starting with sb_publishable_."
        }

        val address = SUPABASE_URL.trimEnd('/') +
                "/rest/v1/programs" +
                "?select=id,name,description,short_description,age_group,schedule_text" +
                "&is_active=eq.true" +
                "&order=display_order.asc.nullslast,id.asc"

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
                        "Access denied. Check the Supabase key and programs read policy."

                    404 ->
                        "The programs table or project address was not found."

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

                JudoProgram(
                    name = row.readText("name"),
                    description = row.readText("description").ifBlank {
                        row.readText("short_description")
                    },
                    ageGroup = row.readText("age_group"),
                    schedule = row.readText("schedule_text")
                )
            }
        } finally {
            connection.disconnect()
        }
    }

@Composable
fun SupabasePrograms() {
    var programs by remember {
        mutableStateOf<List<JudoProgram>>(emptyList())
    }

    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var refreshCount by remember { mutableStateOf(0) }

    LaunchedEffect(refreshCount) {
        loading = true
        error = null

        try {
            programs = fetchPrograms()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            programs = websitePrograms
            error = null
        } finally {
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        when {
            loading -> {
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(12.dp))
                Text("Loading programs…")
            }

            error != null -> {
                Text(
                    text = error ?: "Unable to load programs.",
                    color = MaterialTheme.colorScheme.error
                )
            }

            programs.isEmpty() -> {
                Text("No programs are available yet.")
            }

            else -> {
                programs.forEach { program ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    ) {
                        Column {
                            Image(
                                painter = painterResource(programPhoto(program.name)),
                                contentDescription = program.name,
                                modifier = Modifier.fillMaxWidth().height(190.dp),
                                contentScale = ContentScale.Crop
                            )
                            Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = program.name,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )

                            if (program.description.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(program.description)
                            }

                            if (program.ageGroup.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Age group: ${program.ageGroup}")
                            }

                            if (program.schedule.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Schedule: ${program.schedule}")
                            }
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
