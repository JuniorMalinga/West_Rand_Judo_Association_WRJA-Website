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
import androidx.compose.runtime.mutableStateMapOf
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

private data class NewsArticle(
    val id: String,
    val title: String,
    val excerpt: String,
    val body: String,
    val publishedDate: String
)

private fun JSONObject.newsText(column: String): String {
    return if (isNull(column)) "" else optString(column, "")
}

private suspend fun fetchNews(): List<NewsArticle> =
    withContext(Dispatchers.IO) {

        val address = SUPABASE_URL.trimEnd('/') +
                "/rest/v1/news_posts" +
                "?select=id,title,excerpt,body,published_at" +
                "&post_status=eq.published" +
                "&order=published_at.desc.nullslast,id.asc"

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
                        "Access denied. Check the news_posts read policy."

                    404 ->
                        "The news_posts table or project address was not found."

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

                NewsArticle(
                    id = row.newsText("id"),
                    title = row.newsText("title"),
                    excerpt = row.newsText("excerpt"),
                    body = row.newsText("body"),
                    publishedDate = row.newsText("published_at").take(10)
                )
            }
        } finally {
            connection.disconnect()
        }
    }

@Composable
fun SupabaseNews() {
    var articles by remember {
        mutableStateOf<List<NewsArticle>>(emptyList())
    }

    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var refreshCount by remember { mutableStateOf(0) }

    val expandedArticles = remember {
        mutableStateMapOf<String, Boolean>()
    }

    LaunchedEffect(refreshCount) {
        loading = true
        error = null

        try {
            articles = fetchNews()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            error = if (failure is IllegalStateException) {
                failure.message ?: "Unable to load news."
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
                Text("Loading news…")
            }

            error != null -> {
                Text(
                    text = error ?: "Unable to load news.",
                    color = MaterialTheme.colorScheme.error
                )
            }

            articles.isEmpty() -> {
                Text("No published news articles are available yet.")
            }

            else -> {
                articles.forEach { article ->
                    val expanded =
                        expandedArticles[article.id] == true

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            if (article.publishedDate.isNotBlank()) {
                                Text(
                                    text = article.publishedDate,
                                    style = MaterialTheme.typography.labelMedium
                                )

                                Spacer(modifier = Modifier.height(6.dp))
                            }

                            Text(
                                text = article.title,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            if (expanded) {
                                Text(article.body)
                            } else {
                                val preview = article.excerpt.ifBlank {
                                    if (article.body.length > 180) {
                                        article.body.take(180) + "…"
                                    } else {
                                        article.body
                                    }
                                }

                                Text(preview)
                            }

                            if (article.body.isNotBlank()) {
                                TextButton(
                                    onClick = {
                                        expandedArticles[article.id] =
                                            !expanded
                                    }
                                ) {
                                    Text(
                                        if (expanded) {
                                            "Show less"
                                        } else {
                                            "Read article"
                                        }
                                    )
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