package za.co.wrja.mobile

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
private class AuthRequestException(
    val status: Int,
    message: String
) : Exception(message)

private data class AuthTokens(
    val accessToken: String,
    val refreshToken: String,
    val expiresAtMillis: Long
)

object SupabaseAuth {
    var isLoggedIn by mutableStateOf(false)
        private set

    private var tokens: AuthTokens? = null
    private val mutex = Mutex()

    suspend fun login(
        email: String,
        password: String
    ) = mutex.withLock {
        val body = JSONObject()
            .put("email", email.trim())
            .put("password", password)

        val response = request(
            path = "token?grant_type=password",
            body = body
        )

        saveSession(response)
    }


    suspend fun signUp(
        firstName: String,
        lastName: String,
        phone: String,
        email: String,
        password: String,
        role: String,
        dateOfBirth: String?,
        acceptedTerms: Boolean
    ): Boolean = mutex.withLock {
        require(role == "athlete" || role == "guardian") {
            "Choose athlete or guardian."
        }

        require(acceptedTerms) {
            "Please agree to the club's terms and privacy policy."
        }

        val athleteDob = if (role == "athlete") {
            validateAthleteDateOfBirth(dateOfBirth.orEmpty())
        } else {
            null
        }

        val metadata = JSONObject()
            .put("first_name", firstName.trim())
            .put("last_name", lastName.trim())
            .put("phone", phone.trim())
            .put("profile_role", role)
            .put("terms_accepted", acceptedTerms)

        if (athleteDob != null) {
            metadata.put("date_of_birth", athleteDob)
        }

        val body = JSONObject()
            .put("email", email.trim())
            .put("password", password)
            .put("data", metadata)

        val response = request(
            path = "signup",
            body = body
        )

        if (response.optString("access_token").isNotBlank()) {
            saveSession(response)
            true
        } else {
            false
        }
    }
    private fun validateAthleteDateOfBirth(value: String): String {
        val text = value.trim()

        require(text.isNotBlank()) {
            "Enter your date of birth."
        }

        require(Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}").matches(text)) {
            "Enter your date of birth as YYYY-MM-DD."
        }

        val zone = TimeZone.getTimeZone("Africa/Johannesburg")

        val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply {
            isLenient = false
            timeZone = zone
        }

        val parsed = requireNotNull(
            runCatching { formatter.parse(text) }.getOrNull()
        ) {
            "Enter a valid date of birth."
        }

        val birth = Calendar.getInstance(zone, Locale.ROOT).apply {
            time = parsed
        }

        val today = Calendar.getInstance(zone, Locale.ROOT)

        require(!birth.after(today)) {
            "Your date of birth cannot be in the future."
        }

        var age = today.get(Calendar.YEAR) - birth.get(Calendar.YEAR)

        val birthdayStillAhead =
            today.get(Calendar.MONTH) < birth.get(Calendar.MONTH) ||
                    (
                            today.get(Calendar.MONTH) == birth.get(Calendar.MONTH) &&
                                    today.get(Calendar.DAY_OF_MONTH) <
                                    birth.get(Calendar.DAY_OF_MONTH)
                            )

        if (birthdayStillAhead) {
            age--
        }

        require(age >= 18) {
            "You must be 18 or older to register as an athlete. " +
                    "Under-18 athletes need a parent or guardian to register."
        }

        return text
    }

    // Future member-data requests can use this token.
    // Refreshes an expiring access token before returning it.
    suspend fun accessToken(): String = mutex.withLock {
        refreshIfNeeded()
    }

    suspend fun logout() = mutex.withLock {
        if (tokens == null) {
            clearSession()
            return@withLock
        }

        val token = refreshIfNeeded()

        request(
            path = "logout?scope=local",
            body = null,
            bearerToken = token
        )

        clearSession()
    }

    private suspend fun refreshIfNeeded(): String {
        val current = tokens
            ?: throw IllegalStateException("Please log in again.")

        if (
            System.currentTimeMillis() <
            current.expiresAtMillis - 60_000
        ) {
            return current.accessToken
        }

        try {
            val response = request(
                path = "token?grant_type=refresh_token",
                body = JSONObject()
                    .put("refresh_token", current.refreshToken)
            )

            saveSession(response)
        } catch (failure: AuthRequestException) {
            if (failure.status in listOf(400, 401, 403)) {
                clearSession()
                throw IllegalStateException(
                    "Your session has expired. Please log in again."
                )
            }

            throw failure
        }

        return tokens?.accessToken
            ?: throw IllegalStateException("Please log in again.")
    }

    private fun saveSession(response: JSONObject) {
        val access = response.optString("access_token")
        val refresh = response.optString("refresh_token")

        check(access.isNotBlank() && refresh.isNotBlank()) {
            "Supabase did not return a valid login session."
        }

        val expiresIn = response.optLong("expires_in", 3600)

        tokens = AuthTokens(
            accessToken = access,
            refreshToken = refresh,
            expiresAtMillis =
                System.currentTimeMillis() + expiresIn * 1000
        )

        isLoggedIn = true
    }

    private fun clearSession() {
        tokens = null
        isLoggedIn = false
    }

    private suspend fun request(
        path: String,
        body: JSONObject?,
        bearerToken: String? = null
    ): JSONObject = withContext(Dispatchers.IO) {
        val address = SUPABASE_URL.trimEnd('/') +
                "/auth/v1/$path"

        val connection =
            URL(address).openConnection() as HttpURLConnection

        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.instanceFollowRedirects = false

            connection.setRequestProperty("apikey", SUPABASE_KEY)
            connection.setRequestProperty("Accept", "application/json")

            if (bearerToken != null) {
                connection.setRequestProperty(
                    "Authorization",
                    "Bearer $bearerToken"
                )
            }

            if (body != null) {
                connection.doOutput = true
                connection.setRequestProperty(
                    "Content-Type",
                    "application/json; charset=UTF-8"
                )

                connection.outputStream.use {
                    it.write(body.toString().toByteArray(Charsets.UTF_8))
                }
            }

            val status = connection.responseCode

            val stream = if (status in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream
            }

            val text = stream
                ?.bufferedReader()
                ?.use { it.readText() }
                .orEmpty()

            val json = runCatching {
                JSONObject(text)
            }.getOrElse {
                JSONObject()
            }

            if (status !in 200..299) {
                val code = json.optString("error_code")

                val message = when (code) {
                    "invalid_credentials" ->
                        "Incorrect email or password."

                    "email_not_confirmed" ->
                        "Confirm your email before logging in."

                    "user_already_exists", "email_exists" ->
                        "An account already exists. Try logging in."

                    "signup_disabled" ->
                        "New account registration is disabled."

                    "weak_password" ->
                        "Choose a stronger password."

                    "over_email_send_rate_limit",
                    "over_request_rate_limit" ->
                        "Too many attempts. Please wait before trying again."

                    "unexpected_failure" ->
                        "Supabase could not complete the request. " +
                                "Check the project's Auth logs."

                    else -> json.optString("msg").ifBlank {
                        json.optString("message").ifBlank {
                            json.optString("error_description").ifBlank {
                                "Authentication failed (HTTP $status)."
                            }
                        }
                    }
                }

                throw AuthRequestException(status, message)
            }

            json
        } finally {
            connection.disconnect()
        }
    }
}