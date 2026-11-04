package za.co.wrja.mobile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

internal data class WebsiteChatReply(val answer: String, val mode: String)
internal data class WebsiteChatExchange(val question: String, val answer: String)
internal class WebsiteChatHttpFailure(val status: Int) : IOException("Chat request failed (HTTP $status).")

// The website assistant can change independently of the app. Do not present
// instructions for this retired flow as if it were still available.
private val retiredTrainingFlow = Regex(
    """\b(?:trials?|trialling|trialing|bookings?|book\s+(?:a|an|your|my|the)\s+(?:free\s+)?(?:class|session|lesson)|proef(?:sessie|les|klas)\w*|bespreek|bespreking\w*|[a-z]*bhukh[a-z]*|[a-z]*sivivin[a-z]*|[a-z]*zivivin[a-z]*)\b""",
    RegexOption.IGNORE_CASE
)

internal fun mentionsRetiredTrainingFlow(text: String): Boolean = retiredTrainingFlow.containsMatchIn(text)

/** Uses the website's stateless assistant API; no credentials or account fields are sent. */
internal object WebsiteChatApi {
    private const val Endpoint = "https://westrandjudoassociation.vercel.app/api/chat"
    private const val MaxHistoryExchanges = 12 // Two turns per completed exchange.
    private const val MaxTurnLength = 2400
    private const val MaxHistoryLength = 24_000
    private val modes = setOf("local", "gemini", "fallback", "handoff")

    internal fun requestBody(message: String, previous: List<WebsiteChatExchange>): JSONObject {
        val question = message.replace("\u0000", "").trim()
        require(question.isNotBlank() && question.length <= InputLimits.CHAT_MESSAGE) {
            "Enter a message of up to 2,000 characters."
        }
        var length = 0
        val newestFirst = mutableListOf<WebsiteChatExchange>()
        for (exchange in previous.asReversed()) {
            if (newestFirst.size >= MaxHistoryExchanges) break
            val user = historyContent(exchange.question)
            val answer = historyContent(exchange.answer)
            if (user.isEmpty() || answer.isEmpty()) continue
            if (length + user.length + answer.length > MaxHistoryLength) break
            newestFirst += WebsiteChatExchange(user, answer)
            length += user.length + answer.length
        }
        val history = JSONArray()
        for (exchange in newestFirst.asReversed()) {
            history.put(JSONObject().put("role", "user").put("content", exchange.question))
            history.put(JSONObject().put("role", "assistant").put("content", exchange.answer))
        }
        return JSONObject().put("message", question).put("history", history)
    }

    private fun historyContent(value: String): String {
        val clipped = value.replace("\u0000", "").trim().take(MaxTurnLength)
        return if (clipped.lastOrNull()?.isHighSurrogate() == true) clipped.dropLast(1) else clipped
    }

    internal fun parseReply(responseText: String): WebsiteChatReply {
        val json = try { JSONObject(responseText) } catch (_: org.json.JSONException) {
            throw IOException("Chat returned an invalid response.")
        }
        val answer = (json.opt("answer") as? String)?.trim().orEmpty()
        val mode = json.opt("mode") as? String
        if (answer.isBlank() || mode == null || mode !in modes) {
            throw IOException("Chat returned an invalid response.")
        }
        return WebsiteChatReply(answer, mode)
    }

    suspend fun send(message: String, previous: List<WebsiteChatExchange>): WebsiteChatReply = withContext(Dispatchers.IO) {
        val requestBody = requestBody(message, previous).toString()
        val connection = (URL(Endpoint).openConnection() as HttpURLConnection)
        try {
            connection.instanceFollowRedirects = false
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
            if (responseCode !in 200..299) {
                throw WebsiteChatHttpFailure(responseCode)
            }
            parseReply(connection.inputStream.readBoundedText(512 * 1024))
        } finally {
            connection.disconnect()
        }
    }

}
