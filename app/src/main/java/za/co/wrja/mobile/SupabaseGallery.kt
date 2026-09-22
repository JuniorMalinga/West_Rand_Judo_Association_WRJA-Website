package za.co.wrja.mobile

import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.Image
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.SubcomposeAsyncImage
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL


private const val GALLERY_BUCKET = "gallery"

private data class GalleryPhoto(
    val id: String,
    val title: String,
    val caption: String,
    val imagePath: String
)

private val builtInGalleryPhotos = listOf(
    GalleryPhoto("built-in-adult", "Adult Judo training", "Technique, teamwork and regular dojo sessions.", ""),
    GalleryPhoto("built-in-competition", "Competition action", "WRJA athletes representing their clubs with pride.", ""),
    GalleryPhoto("built-in-kids", "Kids Judo training", "Building confidence, coordination and respect from the start.", "")
)

private fun builtInPhoto(id: String): Int? = when (id) {
    "built-in-adult" -> R.drawable.gallery_adult_1
    "built-in-competition" -> R.drawable.gallery_competition_1
    "built-in-kids" -> R.drawable.gallery_kid_1
    else -> null
}

private fun galleryFallbackPhoto(id: String): Int = builtInPhoto(id) ?: when {
    id.hashCode().and(1) == 0 -> R.drawable.gallery_adult_1
    id.hashCode().and(2) == 0 -> R.drawable.gallery_competition_1
    else -> R.drawable.gallery_kid_1
}

private fun JSONObject.galleryText(column: String): String {
    return if (isNull(column)) "" else optString(column, "")
}

private fun galleryImageUrl(imagePath: String): String? {
    val path = imagePath.trim()

    if (path.isBlank()) return null

    if (path.startsWith("https://")) {
        val uri = Uri.parse(path)

        return if (
            !uri.host.isNullOrBlank() &&
            uri.userInfo == null
        ) {
            path
        } else {
            null
        }
    }

    if (path.contains("://")) return null

    val relativePath = path.trimStart('/')
    val bucket = GALLERY_BUCKET.trim().trim('/')

    val storagePath = when {
        bucket.isBlank() -> relativePath
        relativePath.startsWith("$bucket/") -> relativePath
        else -> "$bucket/$relativePath"
    }

    val parts = storagePath.split('/')

    if (
        parts.size < 2 ||
        parts.any { it.isBlank() || it == "." || it == ".." }
    ) {
        return null
    }

    val builder = Uri.parse(SUPABASE_URL.trimEnd('/'))
        .buildUpon()
        .appendPath("storage")
        .appendPath("v1")
        .appendPath("object")
        .appendPath("public")

    // appendPath encodes spaces and other special characters.
    parts.forEach { builder.appendPath(it) }

    return builder.build().toString()
}

private suspend fun fetchGallery(): List<GalleryPhoto> =
    withContext(Dispatchers.IO) {

        val address = SUPABASE_URL.trimEnd('/') +
                "/rest/v1/gallery_items" +
                "?select=id,title,caption,image_path" +
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
                        "Access denied. Check the gallery_items read policy."

                    404 ->
                        "The gallery_items table or project address was not found."

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

                GalleryPhoto(
                    id = row.galleryText("id"),
                    title = row.galleryText("title"),
                    caption = row.galleryText("caption"),
                    imagePath = row.galleryText("image_path")
                )
            }
        } finally {
            connection.disconnect()
        }
    }

@Composable
fun SupabaseGallery() {
    var photos by remember {
        mutableStateOf<List<GalleryPhoto>>(emptyList())
    }

    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var refreshCount by remember { mutableStateOf(0) }

    LaunchedEffect(refreshCount) {
        loading = true
        error = null

        try {
            photos = fetchGallery()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            error = if (failure is IllegalStateException) {
                failure.message ?: "Unable to load the gallery."
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
                Text("Loading gallery…")
            }

            error != null -> {
                Text(
                    text = error ?: "Unable to load the gallery.",
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text("Featured moments", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                builtInGalleryPhotos.forEach { GalleryPhotoCard(it) }
            }

            photos.isEmpty() -> {
                Text("No online gallery photos are available yet. Showing featured moments.")
                Spacer(modifier = Modifier.height(12.dp))
                builtInGalleryPhotos.forEach { GalleryPhotoCard(it) }
            }

            else -> {
                photos.forEach { photo ->
                    key(photo.id, refreshCount) {
                        GalleryPhotoCard(photo)
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

@Composable
private fun GalleryPhotoCard(photo: GalleryPhoto) {
    val imageUrl = galleryImageUrl(photo.imagePath)
    // Every server-supplied card has an offline visual while storage is being
    // configured or an image URL is temporarily unavailable.
    val fallbackImage = galleryFallbackPhoto(photo.id)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp)
    ) {
        Column {
            if (imageUrl == null) {
                Image(
                    painter = painterResource(fallbackImage),
                    contentDescription = photo.caption.ifBlank { photo.title },
                    modifier = Modifier.fillMaxWidth().height(220.dp),
                    contentScale = ContentScale.Crop
                )
            } else {
                SubcomposeAsyncImage(
                    model = imageUrl,
                    contentDescription = photo.caption.ifBlank {
                        photo.title.ifBlank { "Club gallery photo" }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    contentScale = ContentScale.Fit,
                    loading = {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    },
                    error = {
                        Image(
                            painter = painterResource(fallbackImage),
                            contentDescription = photo.caption.ifBlank { photo.title },
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    }
                )
            }

            if (
                photo.title.isNotBlank() ||
                photo.caption.isNotBlank()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    if (photo.title.isNotBlank()) {
                        Text(
                            text = photo.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (photo.caption.isNotBlank()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(photo.caption)
                    }
                }
            }
        }
    }
}

