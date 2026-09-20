package za.co.wrja.mobile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.UUID

internal data class MemberData(
    val userId: String,
    val profile: JSONObject,
    val athlete: JSONObject?,
    val guardianExists: Boolean,
    val childLinks: List<JSONObject>
)

internal fun JSONObject.memberText(column: String): String {
    return if (isNull(column)) "" else optString(column, "")
}

internal object SupabaseMembers {
    private const val ATHLETE_FIELDS =
        "id,first_name,last_name,date_of_birth,member_number," +
                "weight_category,group_category,is_active"

    suspend fun load(): MemberData {
        // Obtain the signed-in identity from Supabase Auth.
        val user = JSONObject(request("auth/v1/user"))
        val userId = UUID.fromString(user.getString("id")).toString()

        val profiles = JSONArray(
            request(
                "rest/v1/profiles" +
                        "?select=id,profile_role,first_name,last_name,phone,is_active" +
                        "&id=eq.$userId"
            )
        )

        check(profiles.length() == 1) {
            "Your account profile is missing or unavailable. " +
                    "Ask the administrator to check your profile."
        }

        val profile = profiles.getJSONObject(0)
        val role = profile.memberText("profile_role")

        var athlete: JSONObject? = null
        var guardianExists = false
        var childLinks = emptyList<JSONObject>()

        if (role == "athlete") {
            val rows = JSONArray(
                request(
                    "rest/v1/athletes" +
                            "?select=$ATHLETE_FIELDS" +
                            "&profile_id=eq.$userId"
                )
            )

            athlete = rows.optJSONObject(0)
        }

        if (role == "guardian") {
            val guardians = JSONArray(
                request(
                    "rest/v1/guardians" +
                            "?select=id&profile_id=eq.$userId"
                )
            )

            guardianExists = guardians.length() > 0

            if (guardianExists) {
                val guardianId = UUID.fromString(
                    guardians.getJSONObject(0).getString("id")
                ).toString()

                val links = JSONArray(
                    request(
                        "rest/v1/guardian_athletes" +
                                "?select=id,relationship_type,is_primary," +
                                "athlete:athletes($ATHLETE_FIELDS)" +
                                "&guardian_id=eq.$guardianId" +
                                "&order=is_primary.desc,id.asc"
                    )
                )

                childLinks = List(links.length()) {
                    links.getJSONObject(it)
                }
            }
        }

        return MemberData(
            userId = userId,
            profile = profile,
            athlete = athlete,
            guardianExists = guardianExists,
            childLinks = childLinks
        )
    }

    suspend fun saveProfile(
        userId: String,
        firstName: String,
        lastName: String,
        phone: String
    ): JSONObject {
        require(firstName.isNotBlank() && lastName.isNotBlank()) {
            "Enter your first and last names."
        }

        val id = UUID.fromString(userId).toString()

        // Role, ownership and account status are never submitted.
        val body = JSONObject()
            .put("first_name", firstName.trim())
            .put("last_name", lastName.trim())
            .put(
                "phone",
                phone.trim().ifBlank { null } ?: JSONObject.NULL
            )

        return patchOne(
            "profiles?id=eq.$id",
            body
        )
    }

    suspend fun saveAthlete(
        userId: String,
        athleteId: String,
        firstName: String,
        lastName: String,
        dateOfBirth: String,
        weightCategory: String
    ): JSONObject {
        require(firstName.isNotBlank() && lastName.isNotBlank()) {
            "Enter the athlete's first and last names."
        }

        val dateText = dateOfBirth.trim()

        require(Regex("\\d{4}-\\d{2}-\\d{2}").matches(dateText)) {
            "Enter date of birth as YYYY-MM-DD."
        }

        val parsedDate = runCatching {
            SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply {
                isLenient = false
            }.parse(dateText)
        }.getOrNull()

        require(
            parsedDate != null &&
                    parsedDate.time <= System.currentTimeMillis()
        ) {
            "Enter a valid date of birth that is not in the future."
        }

        val ownerId = UUID.fromString(userId).toString()
        val recordId = UUID.fromString(athleteId).toString()

        val body = JSONObject()
            .put("first_name", firstName.trim())
            .put("last_name", lastName.trim())
            .put("date_of_birth", dateText)
            .put(
                "weight_category",
                weightCategory.trim().ifBlank { null } ?: JSONObject.NULL
            )

        // Both the record and its owner must match.
        // Supabase's RLS policies also enforce permissions.
        return patchOne(
            "athletes?id=eq.$recordId&profile_id=eq.$ownerId",
            body
        )
    }

    private suspend fun patchOne(
        tableAndFilter: String,
        body: JSONObject
    ): JSONObject {
        val rows = JSONArray(
            request(
                path = "rest/v1/$tableAndFilter",
                method = "PATCH",
                body = body
            )
        )

        check(rows.length() == 1) {
            "The save did not return an updated record. " +
                    "Refresh and check your access before trying again."
        }

        return rows.getJSONObject(0)
    }

    private suspend fun request(
        path: String,
        method: String = "GET",
        body: JSONObject? = null
    ): String {
        // Uses the user's session, not just the public app key.
        val token = SupabaseAuth.accessToken()

        return withContext(Dispatchers.IO) {
            val connection = URL(
                SUPABASE_URL.trimEnd('/') + "/" + path
            ).openConnection() as HttpURLConnection

            try {
                connection.requestMethod = method
                connection.connectTimeout = 15000
                connection.readTimeout = 15000
                connection.instanceFollowRedirects = false

                connection.setRequestProperty("apikey", SUPABASE_KEY)
                connection.setRequestProperty(
                    "Authorization",
                    "Bearer $token"
                )
                connection.setRequestProperty(
                    "Accept",
                    "application/json"
                )

                if (body != null) {
                    connection.doOutput = true
                    connection.setRequestProperty(
                        "Content-Type",
                        "application/json; charset=UTF-8"
                    )
                    connection.setRequestProperty(
                        "Prefer",
                        "return=representation"
                    )

                    connection.outputStream.use {
                        it.write(
                            body.toString().toByteArray(Charsets.UTF_8)
                        )
                    }
                }

                val status = connection.responseCode

                val stream = if (status in 200..299) {
                    connection.inputStream
                } else {
                    connection.errorStream
                }

                val response = stream
                    ?.bufferedReader()
                    ?.use { it.readText() }
                    .orEmpty()

                if (status !in 200..299) {
                    val code = runCatching {
                        JSONObject(response).optString("code")
                    }.getOrDefault("")

                    val message = when (status) {
                        401 ->
                            "Your session was rejected. Log out and log in again."

                        403 ->
                            "You do not have permission for this action."

                        else ->
                            "Member request failed (HTTP $status" +
                                    if (code.isBlank()) {
                                        ")."
                                    } else {
                                        ", code $code)."
                                    }
                    }

                    throw IllegalStateException(message)
                }

                response
            } finally {
                connection.disconnect()
            }
        }
    }
}