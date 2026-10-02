package za.co.wrja.mobile

import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

internal data class EftCompetition(
    val id: String,
    val title: String,
    val date: String,
    val instructions: String,
    val paymentUrl: String
)

internal data class EftPayment(
    val id: String,
    val eventId: String,
    val paymentFor: String,
    val fileName: String,
    val storagePath: String,
    val status: String,
    val uploadedAt: String
) {
    val statusLabel: String get() = when (status) {
        "submitted" -> "Submitted for review"
        "approved" -> "Approved"
        "rejected" -> "Rejected"
        else -> "Unknown status"
    }
}

internal object SupabasePayments {
    private const val BUCKET = "payment-proofs"
    private fun JSONObject.text(key: String) = if (isNull(key)) "" else optString(key, "")
    private fun uuid(value: String) = UUID.fromString(value).toString()

    suspend fun competitions(): List<EftCompetition> {
        val result = request("/rest/v1/events?select=id,title,event_date,payment_instructions,payment_url" +
            "&event_type=eq.competition&event_status=eq.published&payment_required=eq.true" +
            "&order=display_order.asc,title.asc")
        val rows = JSONArray(result)
        return List(rows.length()) { index ->
            val row = rows.getJSONObject(index)
            EftCompetition(uuid(row.getString("id")), row.getString("title"), row.text("event_date"),
                row.text("payment_instructions"), row.text("payment_url"))
        }
    }

    private suspend fun userId(): String {
        val owner = uuid(JSONObject(request("/auth/v1/user")).getString("id"))
        val profiles = JSONArray(request("/rest/v1/profiles?select=id,is_active&id=eq.$owner"))
        check(profiles.length() == 1 && profiles.getJSONObject(0).optBoolean("is_active")) {
            "Your WRJA profile is unavailable or inactive. Contact the administrator."
        }
        return owner
    }

    suspend fun mine(): List<EftPayment> {
        val owner = userId()
        val rows = JSONArray(request("/rest/v1/payment_proofs" +
            "?select=id,event_id,payment_for,file_name,storage_path,review_status,uploaded_at" +
            "&uploaded_by_profile_id=eq.$owner&order=uploaded_at.desc"))
        return List(rows.length()) { index ->
            val row = rows.getJSONObject(index)
            EftPayment(row.getString("id"), row.text("event_id"), row.text("payment_for"),
                row.text("file_name"), row.text("storage_path"), row.text("review_status"), row.text("uploaded_at"))
        }
    }

    suspend fun submit(file: EftProofFile, competition: EftCompetition?) {
        val owner = userId()
        val proofId = uuid(file.id)
        val path = "$owner/$proofId.${file.extension}"
        val objectUrl = "/storage/v1/object/$BUCKET/$path"
        try {
            request(objectUrl, "POST", file.bytes, file.mimeType, mapOf("x-upsert" to "false"))
        } catch (failure: EftHttpException) {
            // A retry uses the SAME id/path. Never overwrite an existing proof.
            // Storage may report an existing object as HTTP 400 or 409.
            if (failure.status != 400 && failure.status != 409) throw failure
            val existing = try {
                requestBytes("/storage/v1/object/authenticated/$BUCKET/$path")
            } catch (_: EftHttpException) { throw failure }
            check(existing.contentEquals(file.bytes)) { "That upload ID is already in use. Choose the file again." }
        }

        val values = JSONObject()
            .put("id", proofId)
            .put("uploaded_by_profile_id", owner)
            .put("event_id", competition?.id?.let(::uuid) ?: JSONObject.NULL)
            .put("event_registration_id", JSONObject.NULL)
            .put("payment_for", competition?.title ?: "Other / not listed")
            .put("file_name", file.name)
            .put("file_size", file.bytes.size)
            .put("file_type", file.mimeType)
            .put("storage_path", path)
            .put("review_status", "submitted")
            .put("reviewed_at", JSONObject.NULL)

        // A repeated request cannot create a second row for the same selected file.
        // Do not delete the object on a timeout: the DB insert may have succeeded.
        request("/rest/v1/payment_proofs?on_conflict=id", "POST",
            values.toString().toByteArray(Charsets.UTF_8), "application/json",
            mapOf("Prefer" to "resolution=ignore-duplicates,return=minimal"))
    }

    suspend fun proofUrl(payment: EftPayment): String {
        val path = payment.storagePath.split('/').joinToString("/") { Uri.encode(it) }
        val response = JSONObject(request("/storage/v1/object/sign/$BUCKET/$path", "POST",
            JSONObject().put("expiresIn", 60).toString().toByteArray(Charsets.UTF_8)))
        val signed = response.getString("signedURL")
        val base = SUPABASE_URL.trimEnd('/')
        val full = if (signed.startsWith("https://")) signed else "$base/storage/v1/${signed.trimStart('/')}"
        check(Uri.parse(full).scheme == "https" && Uri.parse(full).host == Uri.parse(base).host) {
            "The proof link was invalid."
        }
        return full
    }

    private suspend fun request(
        path: String, method: String = "GET", body: ByteArray? = null,
        type: String = "application/json", headers: Map<String, String> = emptyMap()
    ): String = requestBytes(path, method, body, type, headers).toString(Charsets.UTF_8)

    private suspend fun requestBytes(
        path: String, method: String = "GET", body: ByteArray? = null,
        type: String = "application/json", headers: Map<String, String> = emptyMap()
    ): ByteArray {
        val token = SupabaseAuth.accessToken()
        return withContext(Dispatchers.IO) {
            val connection = URL(SUPABASE_URL.trimEnd('/') + path).openConnection() as HttpURLConnection
            try {
                connection.requestMethod = method
                connection.connectTimeout = 15000
                connection.readTimeout = 30000
                connection.instanceFollowRedirects = false
                connection.setRequestProperty("apikey", SUPABASE_KEY)
                connection.setRequestProperty("Authorization", "Bearer $token")
                connection.setRequestProperty("Accept", "application/json")
                headers.forEach { (key, value) -> connection.setRequestProperty(key, value) }
                if (body != null) {
                    connection.doOutput = true
                    connection.setRequestProperty("Content-Type", type)
                    connection.setFixedLengthStreamingMode(body.size)
                    connection.outputStream.use { it.write(body) }
                }
                val status = connection.responseCode
                if (status !in 200..299) {
                    val message = when (status) {
                        401 -> "Your session was rejected. Log out and sign in again."
                        403 -> "Access denied. Ask the administrator to check the payment and storage policies."
                        404 -> "Payment storage or a required table was not found."
                        413 -> "The file exceeds the storage upload limit."
                        400 -> "The payment request was rejected. Check the database fields and storage policies."
                        409 -> "This upload already exists."
                        else -> "Payment request failed (HTTP $status). Please retry."
                    }
                    throw EftHttpException(status, message)
                }
                connection.inputStream.use { it.readBytes() }
            } finally { connection.disconnect() }
        }
    }
}

internal class EftHttpException(val status: Int, message: String) : IllegalStateException(message)
