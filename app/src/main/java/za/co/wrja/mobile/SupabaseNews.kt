package za.co.wrja.mobile

import androidx.compose.foundation.layout.Column
import coil.compose.AsyncImage
import android.net.Uri
import androidx.compose.ui.platform.LocalContext
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

private data class NewsArticle(
    val id: String,
    val title: String,
    val excerpt: String,
    val body: String,
    val publishedDate: String,
    val imagePath: String = ""
)

private fun newsPhoto(index: Int): Int = listOf(
    R.drawable.news_1, R.drawable.news_2, R.drawable.news_3, R.drawable.news_4
)[index % 4]

private val websiteNews = listOf(
    NewsArticle("website-1", "National success for Golden Score judokas", "Golden Score athletes earned four gold, six silver and four bronze medals at the National Schools and SA Open Judo Championships in Gqeberha.", "", "2026-08-04"),
    NewsArticle("website-2", "4 KJK Judo athletes claim medals at African Cup", "Tia Sheppard, Shasa-Mercedez Erasmus, Adriaan Jansen van Vuuren and Nico Sheppard brought home medals from the African Cup Tournament in Brixton.", "", "2026-07-24"),
    NewsArticle("website-3", "Golden Score judokas stand tall among Africa's best", "Dane van Heerden won Cadet Boys under-50kg gold and Madison Lombaard earned silver at the African Championships in Johannesburg.", "", "2026-07-18"),
    NewsArticle("website-4", "Suid-Afrikaanse Judokampioenskappe lok land se beste judokas na Gqeberha", "The South African Judo Championships brought the country's top judokas together in Gqeberha.", "", "2026-07-09")
)

private fun JSONObject.newsText(column: String): String {
    return if (isNull(column)) "" else optString(column, "")
}

private suspend fun fetchNews(): List<NewsArticle> =
    withContext(Dispatchers.IO) {

        val address = SUPABASE_URL.trimEnd('/') +
                "/rest/v1/news_posts" +
                "?select=id,title,excerpt,body,published_at,image_path" +
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
                .readBoundedText()

            val rows = JSONArray(response)

            List(rows.length()) { index ->
                val row = rows.getJSONObject(index)

                NewsArticle(
                    id = row.newsText("id"),
                    title = row.newsText("title"),
                    excerpt = row.newsText("excerpt"),
                    body = row.newsText("body"),
                    publishedDate = row.newsText("published_at").take(10),
                    imagePath = row.newsText("image_path")
                )
            }
        } finally {
            connection.disconnect()
        }
    }

@Composable
fun SupabaseNews() {
    val context = LocalContext.current
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
            reportFailure("Refresh news", failure)
            if (articles.isEmpty()) articles = websiteNews
            error = "offline"
        } finally {
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        if (error != null) {
            Text(localized("Could not refresh news. Showing available articles.", "Kon nie nuus verfris nie. Beskikbare artikels word gewys.", "Izindaba azivuselelwanga. Kuboniswa izihloko ezitholakalayo."), color = MaterialTheme.colorScheme.error)
        }
        when {
            loading -> {
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(12.dp))
                Text("Loading news…")
            }

            articles.isEmpty() -> {
                Text("No published news articles are available yet.")
            }

            else -> {
                articles.forEachIndexed { index, article ->
                    val expanded =
                        expandedArticles[article.id] == true

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    ) {
                        Column {
                            val imageUrl = publicMediaUrl(article.imagePath)
                            var imageFailed by remember(article.id, imageUrl, refreshCount) { mutableStateOf(false) }
                            AsyncImage(
                                model = imageUrl,
                                fallback = painterResource(if (article.id.startsWith("website-")) newsPhoto(index) else R.drawable.wrja_logo),
                                error = painterResource(R.drawable.wrja_logo),
                                contentDescription = article.title,
                                modifier = Modifier.fillMaxWidth().height(190.dp),
                                contentScale = ContentScale.Crop,
                                onError = { imageFailed = true }
                            )
                            if (imageFailed || (article.imagePath.isNotBlank() && imageUrl == null)) {
                                Text(localized("Article photo unavailable.", "Artikelfoto onbeskikbaar.", "Isithombe sesihloko asitholakali."), Modifier.padding(horizontal = 18.dp, vertical = 6.dp), color = MaterialTheme.colorScheme.error)
                            }
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
                                            localized("Show less", "Wys minder", "Bonisa okuncane")
                                        } else {
                                            localized("Read article", "Lees artikel", "Funda isihloko")
                                        }
                                    )
                                }
                            }
                            TextButton(onClick = {
                                val newsPage = "https://westrandjudoassociation.vercel.app/news"
                                val link = if (article.id.startsWith("website-")) newsPage else "$newsPage/${Uri.encode(article.id)}"
                                openPublicWebsite(context, link)
                            }) { Text(localized("Open on website", "Maak op webwerf oop", "Vula kuwebhusayithi")) }
                            }
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
}
