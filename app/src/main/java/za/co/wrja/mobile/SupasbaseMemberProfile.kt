package za.co.wrja.mobile

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.IOException

@Composable
fun SupabaseMemberProfile() {
    var data by remember { mutableStateOf<MemberData?>(null) }
    var loading by remember { mutableStateOf(true) }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var refreshCount by remember { mutableStateOf(0) }

    val scope = rememberCoroutineScope()

    fun displayError(failure: Exception): String {
        return if (failure is IOException) {
            "Connection interrupted. Refresh to check the latest " +
                    "saved details before trying again."
        } else {
            failure.message ?: "Unable to complete the request."
        }
    }

    fun save(action: suspend () -> Unit) {
        if (saving) return

        saving = true
        error = null
        message = null

        scope.launch {
            try {
                action()
                message = "Changes saved."
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                error = displayError(failure)
            } finally {
                saving = false
            }
        }
    }

    LaunchedEffect(refreshCount) {
        loading = true
        error = null
        message = null

        try {
            data = SupabaseMembers.load()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            error = displayError(failure)
        } finally {
            loading = false
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(12.dp))
        }

        message?.let {
            Text(it)
            Spacer(Modifier.height(12.dp))
        }

        if (loading) {
            CircularProgressIndicator()
            Spacer(Modifier.height(12.dp))
            Text("Loading your profile…")
        } else {
            val current = data

            if (current != null) {
                val profile = current.profile
                val role = profile.memberText("profile_role")
                val active = profile.optBoolean("is_active", false)

                Text(
                    "ACCOUNT DETAILS",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                Text("Account type: $role")
                Spacer(Modifier.height(12.dp))

                if (!active) {
                    Text(
                        "Your account is inactive. Contact the club " +
                                "administrator for assistance."
                    )
                } else {
                    MemberEditForm(
                        record = profile,
                        athleteForm = false,
                        busy = saving,
                        onSave = { first, last, phone, _ ->
                            save {
                                val updated = SupabaseMembers.saveProfile(
                                    userId = current.userId,
                                    firstName = first,
                                    lastName = last,
                                    phone = phone
                                )

                                data = current.copy(profile = updated)
                            }
                        }
                    )

                    Spacer(Modifier.height(24.dp))

                    when (role) {
                        "athlete" -> {
                            Text(
                                "ATHLETE DETAILS",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )

                            Spacer(Modifier.height(12.dp))

                            val athlete = current.athlete

                            if (athlete == null) {
                                Text(
                                    "No athlete record is linked to your " +
                                            "account yet. Contact the administrator."
                                )
                            } else {
                                Text(
                                    "Member number: " +
                                            athlete.memberText("member_number")
                                                .ifBlank { "Not assigned" }
                                )

                                Text(
                                    "Group: " +
                                            athlete.memberText("group_category")
                                                .ifBlank { "Not assigned" }
                                )

                                Spacer(Modifier.height(12.dp))

                                if (!athlete.optBoolean("is_active", false)) {
                                    Text(
                                        "Your athlete record is inactive. " +
                                                "Contact the administrator."
                                    )
                                } else {
                                    MemberEditForm(
                                        record = athlete,
                                        athleteForm = true,
                                        busy = saving,
                                        onSave = { first, last, dob, weight ->
                                            save {
                                                val updated =
                                                    SupabaseMembers.saveAthlete(
                                                        userId = current.userId,
                                                        athleteId =
                                                            athlete.getString("id"),
                                                        firstName = first,
                                                        lastName = last,
                                                        dateOfBirth = dob,
                                                        weightCategory = weight
                                                    )

                                                data = current.copy(
                                                    athlete = updated
                                                )
                                            }
                                        }
                                    )
                                }
                            }
                        }

                        "guardian" -> {
                            Text(
                                "MY CHILDREN",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )

                            Spacer(Modifier.height(12.dp))

                            when {
                                !current.guardianExists -> {
                                    Text(
                                        "Your guardian record has not been " +
                                                "set up yet. Contact the administrator."
                                    )
                                }

                                current.childLinks.isEmpty() -> {
                                    Text(
                                        "No children are linked to your " +
                                                "account yet. Contact the administrator."
                                    )
                                }

                                else -> {
                                    current.childLinks.forEach { link ->
                                        LinkedChildCard(link)
                                    }
                                }
                            }
                        }

                        "administrator" -> {
                            Text(
                                "This screen edits your own account. " +
                                        "Member administration is handled separately."
                            )
                        }
                    }
                }
            }

            TextButton(
                enabled = !saving,
                onClick = { refreshCount++ }
            ) {
                Text("Refresh")
            }
        }
    }
}

@Composable
private fun MemberEditForm(
    record: JSONObject,
    athleteForm: Boolean,
    busy: Boolean,
    onSave: (String, String, String, String) -> Unit
) {
    // Reset the form when the saved server record changes.
    val recordVersion = record.toString()

    var firstName by remember(recordVersion) {
        mutableStateOf(record.memberText("first_name"))
    }

    var lastName by remember(recordVersion) {
        mutableStateOf(record.memberText("last_name"))
    }

    var thirdField by remember(recordVersion) {
        mutableStateOf(
            record.memberText(
                if (athleteForm) "date_of_birth" else "phone"
            )
        )
    }

    var weight by remember(recordVersion) {
        mutableStateOf(record.memberText("weight_category"))
    }

    Column {
        OutlinedTextField(
            value = firstName,
            onValueChange = { firstName = it },
            label = { Text("First name") },
            singleLine = true,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            value = lastName,
            onValueChange = { lastName = it },
            label = { Text("Last name") },
            singleLine = true,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            value = thirdField,
            onValueChange = { thirdField = it },
            label = {
                Text(
                    if (athleteForm) {
                        "Date of birth — YYYY-MM-DD"
                    } else {
                        "Phone number"
                    }
                )
            },
            singleLine = true,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth()
        )

        if (athleteForm) {
            Spacer(Modifier.height(10.dp))

            OutlinedTextField(
                value = weight,
                onValueChange = { weight = it },
                label = { Text("Weight category") },
                singleLine = true,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )
        }

        Spacer(Modifier.height(12.dp))

        Button(
            enabled = !busy,
            onClick = {
                onSave(firstName, lastName, thirdField, weight)
            }
        ) {
            Text(
                if (busy) {
                    "Saving…"
                } else if (athleteForm) {
                    "Save athlete details"
                } else {
                    "Save account details"
                }
            )
        }
    }
}

@Composable
private fun LinkedChildCard(link: JSONObject) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp)
    ) {
        Column(Modifier.padding(18.dp)) {
            val athlete = link.optJSONObject("athlete")

            if (athlete == null) {
                Text(
                    "A child link exists, but the athlete details " +
                            "are unavailable. Contact the administrator."
                )
            } else {
                Text(
                    text = athlete.memberText("first_name") + " " +
                            athlete.memberText("last_name"),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                Spacer(Modifier.height(8.dp))

                Text("Date of birth: ${athlete.memberText("date_of_birth")}")

                Text(
                    "Member number: " +
                            athlete.memberText("member_number")
                                .ifBlank { "Not assigned" }
                )

                Text(
                    "Weight category: " +
                            athlete.memberText("weight_category")
                                .ifBlank { "Not assigned" }
                )

                Text(
                    "Group: " +
                            athlete.memberText("group_category")
                                .ifBlank { "Not assigned" }
                )

                val relationship = link.memberText("relationship_type")

                if (relationship.isNotBlank()) {
                    Text("Relationship: $relationship")
                }

                if (link.optBoolean("is_primary", false)) {
                    Text("You are the primary guardian.")
                }

                if (!athlete.optBoolean("is_active", false)) {
                    Text("Athlete record inactive.")
                }
            }
        }
    }
}