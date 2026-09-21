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
import android.content.Context
import android.util.AtomicFile
import kotlinx.coroutines.NonCancellable
import java.io.File
import java.io.IOException
private class AuthRequestException(
    val status: Int,
    message: String
) : Exception(message)

internal data class AuthTokens(
    val accessToken: String,
    val refreshToken: String,
    val expiresAtMillis: Long
)

object SupabaseAuth {
    var isLoggedIn by mutableStateOf(false)
        private set

    /** A refresh token exists locally but needs fingerprint approval to unlock. */
    var hasRememberedSession by mutableStateOf(false)
        private set

    private var tokens: AuthTokens? = null
    private val mutex = Mutex()
    private var rememberSession = false
    private var initialized = false
    private var savedLogin: AtomicFile? = null

    suspend fun initialize(context: Context) = mutex.withLock {
        if (initialized) return@withLock

        val file = AtomicFile(
            File(context.applicationContext.noBackupFilesDir, "remembered_login")
        )

        savedLogin = file

        val savedToken = withContext(Dispatchers.IO) {
            try {
                file.openRead().bufferedReader(Charsets.UTF_8).use {
                    it.readText().trim().ifBlank { null }
                }
            } catch (_: IOException) {
                null
            }
        }

        if (savedToken != null) {
            // The existing accessToken() function will refresh this session
            // when the app next requests authenticated data.
            tokens = AuthTokens(
                accessToken = "",
                refreshToken = savedToken,
                expiresAtMillis = 0
            )
            rememberSession = true
            hasRememberedSession = true
        }

        initialized = true
    }

    private suspend fun storeRefreshToken(value: String?) {
        withContext(Dispatchers.IO) {
            val file = checkNotNull(savedLogin) {
                "Authentication has not been initialized."
            }

            val output = file.startWrite()

            try {
                // Empty content removes the remembered token.
                output.write(value.orEmpty().toByteArray(Charsets.UTF_8))
                file.finishWrite(output)
            } catch (failure: Exception) {
                file.failWrite(output)
                throw failure
            }
        }
    }

    suspend fun login(
        email: String,
        password: String,
        rememberMe: Boolean = false
    ) = mutex.withLock {
        val response = request(
            path = "token?grant_type=password",
            body = JSONObject()
                .put("email", email.trim())
                .put("password", password)
        )

        saveSession(response, remember = rememberMe)
    }

    /** Called only after Android's fingerprint prompt reports success. */
    suspend fun unlockRememberedSession() = mutex.withLock {
        check(tokens != null && hasRememberedSession) {
            "No remembered session is available."
        }
        isLoggedIn = true
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
            saveSession(response, remember = false)
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

    private suspend fun saveSession(
        response: JSONObject,
        remember: Boolean = rememberSession
    ) {
        val access = response.optString("access_token")
        val refresh = response.optString("refresh_token")

        check(access.isNotBlank() && refresh.isNotBlank()) {
            "Supabase did not return a valid login session."
        }

        val nextTokens = AuthTokens(
            accessToken = access,
            refreshToken = refresh,
            expiresAtMillis = System.currentTimeMillis() +
                    response.optLong("expires_in", 3600) * 1000
        )

        withContext(NonCancellable) {
            storeRefreshToken(if (remember) refresh else null)

            tokens = nextTokens
            rememberSession = remember
            hasRememberedSession = remember
            isLoggedIn = true
        }
    }

    private suspend fun clearSession() {
        withContext(NonCancellable) {
            storeRefreshToken(null)

            tokens = null
            rememberSession = false
            hasRememberedSession = false
            isLoggedIn = false
        }
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
