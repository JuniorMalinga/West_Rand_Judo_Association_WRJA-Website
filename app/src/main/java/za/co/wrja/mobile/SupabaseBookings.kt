package za.co.wrja.mobile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

data class BookingProgram(val id: String, val name: String)

data class BookingRequest(
    val id: String,
    val programId: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val paymentMethod: String,
    val preferredDate: String,
    val preferredTime: String,
    val notes: String
)

object SupabaseBookings {
    suspend fun loadPrograms(): List<BookingProgram> {
        val token = if (SupabaseAuth.isLoggedIn) SupabaseAuth.accessToken() else null

        val response = request(
            "GET", "rest/v1/programs?select=id,name&is_active=eq.true&order=name.asc,id.asc", token
        )
        requireSuccess(response)
        val rows = JSONArray(response.text)
        return List(rows.length()) { index ->
            val row = rows.getJSONObject(index)
            BookingProgram(
                id = UUID.fromString(row.getString("id")).toString(),
                name = row.getString("name")
            )
        }
    }

    suspend fun submit(booking: BookingRequest) {
        check(SupabaseAuth.isLoggedIn) { "Please log in before requesting a booking." }
        val token = SupabaseAuth.accessToken()
        val id = UUID.fromString(booking.id).toString()
        val programId = UUID.fromString(booking.programId).toString()
        val userResponse = request("GET", "auth/v1/user", token)
        requireSuccess(userResponse)
        val userId = UUID.fromString(JSONObject(userResponse.text).getString("id")).toString()
        val profileResponse = request("GET", "rest/v1/profiles?select=id&id=eq.$userId", token)
        requireSuccess(profileResponse)
        val profiles = JSONArray(profileResponse.text)
        check(profiles.length() == 1 && profiles.getJSONObject(0).getString("id") == userId) {
            "Your account profile is missing or unavailable. Ask the project administrator to check it."
        }

        val body = JSONObject()
            .put("id", id)
            .put("program_id", programId)
            .put("requester_profile_id", userId)
            .put("full_name", booking.fullName)
            .put("email", booking.email)
            .put("phone", booking.phone)
            .put("payment_method", booking.paymentMethod.trim().lowercase(java.util.Locale.ROOT))
            .put("preferred_date", booking.preferredDate)
            .put("preferred_time", booking.preferredTime)
            .put("notes", booking.notes)


        val response = request("POST", "rest/v1/trial_requests", token, body)
        if (response.status in 200..299) return

        val code = errorCode(response)
        if (response.status == 409 && code == "23505") {


            val existing = request(
                "GET", "rest/v1/trial_requests?select=id&id=eq.$id&requester_profile_id=eq.$userId", token
            )
            if (existing.status !in 200..299) {
                throw IllegalStateException(
                    "This request may already be saved, but the app cannot verify it. " +
                        "Ask the club to check before submitting another request."
                )
            }
            val rows = JSONArray(existing.text)
            if (rows.length() == 1 && rows.getJSONObject(0).optString("id") == id) return
        }
        throw failure(response)
    }

    private data class Response(val status: Int, val text: String)

    private fun errorCode(response: Response): String =
        runCatching { JSONObject(response.text).optString("code") }.getOrDefault("")

    private fun requireSuccess(response: Response) {
        if (response.status !in 200..299) throw failure(response)
    }

    private fun failure(response: Response): IllegalStateException {
        val code = errorCode(response)
        val message = when {
            code == "23502" ->
                "A required database field was missing. Share the trial_requests table definition so the app payload can be matched."
            code == "22P02" || code == "23514" ->
                "A booking value does not match the existing database rules. Share the table definition to check the allowed values."
            code == "23503" ->
                "The selected program or your profile is unavailable. Refresh programs and try again."
            response.status == 401 ->
                "Your session or app key was rejected. Log in again and check the existing Supabase configuration."
            response.status == 403 || code == "42501" ->
                "The existing database permissions do not allow this request. Share this error with the project administrator."
            response.status == 404 ->
                "The required table or API endpoint is unavailable. Check that the app uses the correct Supabase project."
            response.status == 409 ->
                "A matching request may already exist. Ask the club to check before submitting another request."
            response.status == 429 ->
                "Too many requests. Please wait a moment and retry."
            else -> "Supabase could not complete the booking request."
        }
        val details = "HTTP ${response.status}" + if (code.isNotBlank()) ", $code" else ""
        return IllegalStateException("$message ($details)")
    }

    private suspend fun request(
        method: String,
        path: String,
        token: String?,
        body: JSONObject? = null
    ): Response = withContext(Dispatchers.IO) {
        val connection = URL(SUPABASE_URL.trimEnd('/') + "/" + path)
            .openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.instanceFollowRedirects = false
            connection.setRequestProperty("apikey", SUPABASE_KEY)
            if (token != null) connection.setRequestProperty("Authorization", "Bearer $token")
            connection.setRequestProperty("Accept", "application/json")
            if (body != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                connection.setRequestProperty("Prefer", "return=minimal")
                connection.outputStream.use {
                    it.write(body.toString().toByteArray(Charsets.UTF_8))
                }
            }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            Response(status, stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty())
        } catch (failure: IOException) {
            throw IOException(
                "Could not confirm the booking. Check your connection and retry with the same details.",
                failure
            )
        } finally {
            connection.disconnect()
        }
    }
}
