package za.co.wrja.mobile

import android.util.Patterns
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import java.io.IOException


@Composable
fun SupabaseAuthScreen(onLanguageChanged: (AppLanguage) -> Unit = {}) {
    var signUpMode by remember { mutableStateOf(false) }

    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }

    // Passwords are not saved to disk or saved instance state.
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }

    var role by remember { mutableStateOf("athlete") }
    var dateOfBirth by remember { mutableStateOf("") }
    var acceptedTerms by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val gold = Color(0xFFC9A227)

    BackHandler(enabled = signUpMode && !busy) {
        signUpMode = false
        password = ""
        confirmPassword = ""
        error = null
    }

    if (!signUpMode) {
        LoginScreen(
            signUp = {
                signUpMode = true
                password = ""
                confirmPassword = ""
                dateOfBirth = ""
                acceptedTerms = false
                error = null
                notice = null
            },
            initialEmail = email,
            notice = notice,
            onLanguageChanged = onLanguageChanged
        )

        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(28.dp))

        Text(
            text = "WEST RAND JUDO",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = if (signUpMode) "Create your account" else "Welcome back",
            style = MaterialTheme.typography.titleLarge
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (signUpMode) {
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text("First name") },
                singleLine = true,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text("Last name") },
                singleLine = true,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Phone number — optional") },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Phone
                ),
                singleLine = true,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                FilterChip(
                    selected = role == "athlete",
                    onClick = { role = "athlete" },
                    enabled = !busy,
                    label = { Text("Athlete") }
                )

                FilterChip(
                    selected = role == "guardian",
                    onClick = { role = "guardian" },
                    enabled = !busy,
                    label = { Text("Parent / Guardian") }
                )
            }
        }

        if (signUpMode && role == "athlete") {
            OutlinedTextField(
                value = dateOfBirth,
                onValueChange = {
                    dateOfBirth = it
                    error = null
                },
                label = { Text("Date of birth") },
                placeholder = { Text("YYYY-MM-DD") },
                supportingText = {
                    Text("You must be 18 or older to register as an athlete.")
                },
                singleLine = true,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))
        }

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email address") },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email
            ),
            singleLine = true,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password
            ),
            singleLine = true,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth()
        )

        if (signUpMode) {
            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = { Text("Confirm password") },
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password
                ),
                singleLine = true,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )
        }

        if (signUpMode) {
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = acceptedTerms,
                    onCheckedChange = { acceptedTerms = it },
                    enabled = !busy,
                    colors = CheckboxDefaults.colors(
                        checkedColor = gold
                    )
                )

                Text(
                    text = "I agree to the club's terms and privacy policy",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        error?.let {
            Spacer(modifier = Modifier.height(12.dp))
            Text(it, color = MaterialTheme.colorScheme.error)
        }

        notice?.let {
            Spacer(modifier = Modifier.height(12.dp))
            Text(it)
        }

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            enabled = !busy && acceptedTerms,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = gold,
                contentColor = Color.Black
            ),
            onClick = {
                error = null
                notice = null

                val validationError = when {
                    !Patterns.EMAIL_ADDRESS
                        .matcher(email.trim())
                        .matches() ->
                        "Enter a valid email address."

                    password.isBlank() ->
                        "Enter your password."

                    signUpMode &&
                            (firstName.isBlank() || lastName.isBlank()) ->
                        "Enter your first and last names."

                    signUpMode && password.length < 8 ->
                        "Use at least 8 characters for your password."

                    signUpMode && password != confirmPassword ->
                        "The passwords do not match."

                    else -> null
                }

                if (validationError != null) {
                    error = validationError
                } else {
                    busy = true

                    scope.launch {
                        try {
                            if (signUpMode) {
                                val signedIn = SupabaseAuth.signUp(
                                    firstName = firstName,
                                    lastName = lastName,
                                    phone = phone,
                                    email = email,
                                    password = password,
                                    role = role,
                                    dateOfBirth = if (role == "athlete") dateOfBirth else null,
                                    acceptedTerms = acceptedTerms
                                )

                                if (!signedIn) {
                                    signUpMode = false
                                    password = ""
                                    confirmPassword = ""

                                    notice =
                                        "Check your email for a confirmation " +
                                                "link, then return here to log in. " +
                                                "If you already have an account, log in."
                                }
                            } else {
                                SupabaseAuth.login(email, password)
                            }
                        } catch (cancelled: CancellationException) {
                            throw cancelled
                        } catch (failure: Exception) {
                            error = if (failure is IOException) {
                                "Could not connect. Check your internet " +
                                        "connection and try again."
                            } else {
                                failure.message ?: "Authentication failed."
                            }
                        } finally {
                            busy = false
                        }
                    }
                }
            }
        ) {
            if (busy) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = Color.Black,
                    strokeWidth = 2.dp
                )
            } else {
                Text(if (signUpMode) "CREATE ACCOUNT" else "LOG IN")
            }
        }

        TextButton(
            enabled = !busy,
            onClick = {
                signUpMode = !signUpMode
                password = ""
                confirmPassword = ""
                error = null
                notice = null
            }
        ) {
            Text(
                if (signUpMode) {
                    "Already have an account? Log in"
                } else {
                    "Don't have an account? Sign up"
                }
            )
        }
    }
}
