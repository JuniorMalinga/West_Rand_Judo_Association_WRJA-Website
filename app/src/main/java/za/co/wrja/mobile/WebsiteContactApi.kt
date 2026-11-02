package za.co.wrja.mobile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/** Public enquiry endpoint shared with the production website.
 * SMTP and database service credentials belong on the server, never in the APK.
 * The website accepts public enquiries; its cookie-based session is independent
 * of the app's Supabase session. Do not send an unrelated bearer token.
 */
object WebsiteContactApi {
    suspend fun submit(name: String, email: String, phone: String, message: String): Boolean =
        withContext(Dispatchers.IO) {
            val connection = URL("https://westrandjudoassociation.vercel.app/api/messages")
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
                val payload = JSONObject()
                    .put("name", name.trim()).put("email", email.trim())
                    .put("phone", phone.trim()).put("message", message.trim())
                    .put("source", "Android app: Contact page").put("website", "")
                connection.outputStream.bufferedWriter(Charsets.UTF_8).use { it.write(payload.toString()) }
                val status = connection.responseCode
                val response = (if (status in 200..299) connection.inputStream else connection.errorStream)
                    ?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
                val json = runCatching { JSONObject(response) }.getOrNull()
                if (status !in 200..299 || json?.optBoolean("success") != true) {
                    throw ContactRejectedException(status)
                }
                json.optBoolean("confirmationEmailSent", false)
            } finally {
                connection.disconnect()
            }
        }
}

class ContactRejectedException(val status: Int) : IOException("Contact request rejected (HTTP $status).")
