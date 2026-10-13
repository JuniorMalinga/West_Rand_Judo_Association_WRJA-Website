package za.co.wrja.mobile

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Client for the same assistant endpoint used by the WRJA website.
 *
 * The endpoint owns conversation history.  The returned session id is saved by
 * [WebsiteChatSessionStore] and sent with each later message, so a user keeps a
 * continuous conversation without exposing any server credentials in the app.
 */
data class WebsiteChatResult(
    val success: Boolean,
    val sessionId: String?,
    val answer: String?,
    val error: String?
)

object WebsiteChatApi {
    private const val Endpoint = "https://westrandjudoassociation.vercel.app/api/chat"

    suspend fun send(message: String, sessionId: String?): WebsiteChatResult = withContext(Dispatchers.IO) {
        val connection = (URL(Endpoint).openConnection() as HttpURLConnection)
        try {
            val requestBody = JSONObject()
                .put("message", message.trim())
                .apply {
                    if (!sessionId.isNullOrBlank()) put("sessionId", sessionId)
                }
                .toString()

            connection.requestMethod = "POST"
            connection.connectTimeout = 30_000
            connection.readTimeout = 40_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("X-Requested-With", "wrja-web")

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(requestBody)
            }

            val responseCode = connection.responseCode
            val responseText = (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
                ?.bufferedReader()
                ?.use { it.readText() }
                .orEmpty()
            val json = runCatching { JSONObject(responseText) }.getOrNull()
            val result = WebsiteChatResult(
                success = json?.optBoolean("success", false) ?: false,
                sessionId = json.optionalString("sessionId"),
                answer = json.optionalString("answer"),
                error = json.optionalString("error")
            )

            if (responseCode !in 200..299) {
                throw IOException(result.error ?: result.answer ?: "WRJA Assistant is unavailable (HTTP $responseCode).")
            }
            if (!result.success) {
                throw IOException(result.error ?: result.answer ?: "WRJA Assistant is unavailable.")
            }
            result
        } finally {
            connection.disconnect()
        }
    }

    private fun JSONObject?.optionalString(key: String): String? =
        if (this == null || isNull(key)) null else optString(key).trim().ifEmpty { null }
}

/** Persists only the opaque server-issued conversation id; no messages or credentials are stored locally. */
object WebsiteChatSessionStore {
    // New namespace prevents session identifiers issued by the retired Vercel deployment
    // from being sent to the current WRJA Assistant deployment.
    private const val PreferencesName = "wrja_chat_v2"
    private const val SessionIdKey = "website_chat_session_id"

    fun read(context: Context): String? =
        context.getSharedPreferences(PreferencesName, Context.MODE_PRIVATE).getString(SessionIdKey, null)

    fun save(context: Context, sessionId: String?) {
        context.getSharedPreferences(PreferencesName, Context.MODE_PRIVATE)
            .edit()
            .apply {
                if (sessionId.isNullOrBlank()) remove(SessionIdKey) else putString(SessionIdKey, sessionId)
            }
            .apply()
    }
}
