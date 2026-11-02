package za.co.wrja.mobile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/** Uses the website's emailed OTP recovery flow; credentials stay server-side. */
object PasswordResetApi {
    suspend fun post(action: String, payload: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        require(action in setOf("request", "verify", "complete"))
        val connection = URL("https://westrandjudoassociation.vercel.app/api/auth/password-reset-$action")
            .openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 15_000
            connection.readTimeout = 40_000
            connection.instanceFollowRedirects = false
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("X-Requested-With", "wrja-web")
            connection.outputStream.bufferedWriter(Charsets.UTF_8).use { it.write(payload.toString()) }
            val status = connection.responseCode
            val body = (if (status in 200..299) connection.inputStream else connection.errorStream)
                ?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            val json = runCatching { JSONObject(body) }.getOrNull()
            if (status !in 200..299 || json?.optBoolean("success") != true) {
                throw PasswordResetFailure(status, json?.optString("error").orEmpty(), json?.optInt("retryAfterSeconds", 0) ?: 0)
            }
            json
        } finally {
            connection.disconnect()
        }
    }
}

class PasswordResetFailure(val status: Int, val reason: String, val retryAfter: Int) : IOException("Password reset request failed (HTTP $status).")
