package za.co.wrja.mobile

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
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
fun SupabaseAuthScreen(
    onLanguageChanged: (AppLanguage) -> Unit = {},
    onFingerprintUnlock: (((String) -> Unit) -> Unit)? = null
) {
    var signUpMode by remember { mutableStateOf(false) }

    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var firstNameInputRejected by remember { mutableStateOf(false) }
    var lastNameInputRejected by remember { mutableStateOf(false) }
    var phone by remember { mutableStateOf("") }
    var phoneInputRejected by remember { mutableStateOf(false) }
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
    val gold = Color(0xFFF1BD16)
    val invalidNameError = localized("Enter a first and last name using letters only.", "Voer 'n voor- en van in met slegs letters.", "Faka igama lokuqala nesibongo usebenzisa izinhlamvu kuphela.")
    val invalidEmailError = localized("Enter a valid email address.", "Voer 'n geldige e-posadres in.", "Faka ikheli le-imeyili elivumelekile.")
    val missingPasswordError = localized("Enter your password.", "Voer jou wagwoord in.", "Faka iphasiwedi yakho.")
    val invalidDateError = localized("Enter a valid date of birth. Athletes must be at least 18.", "Voer 'n geldige geboortedatum in. Atlete moet minstens 18 wees.", "Faka usuku lokuzalwa oluvumelekile. Abasubathi kufanele babe neminyaka engu-18 okungenani.")
    val weakPasswordError = localized("Use 8 or more characters, including a letter and a number.", "Gebruik 8 of meer karakters, insluitend 'n letter en 'n syfer.", "Sebenzisa izinhlamvu eziyi-8 noma ngaphezulu, kufaka uhlamvu nenombolo.")
    val mismatchPasswordError = localized("The passwords do not match.", "Die wagwoorde stem nie ooreen nie.", "Amaphasiwedi awafani.")
    val confirmationNotice = localized("Check your email for a confirmation link, then return here to log in. If you already have an account, log in.", "Gaan jou e-pos na vir 'n bevestigingskakel, en keer dan hierheen terug om aan te meld. Meld aan as jy reeds 'n rekening het.", "Hlola i-imeyili yakho ukuze uthole isixhumanisi sokuqinisekisa, bese ubuya lapha ukuze ungene. Ngena uma usuvele une-akhawunti.")
    val connectionError = localized("Could not connect. Check your internet connection and try again.", "Kon nie koppel nie. Gaan jou internetverbinding na en probeer weer.", "Ayikwazanga ukuxhuma. Hlola uxhumano lwakho lwe-inthanethi bese uzama futhi.")
    val authenticationFailedError = localized("Authentication failed.", "Stawing het misluk.", "Ukuqinisekisa kwehlulekile.")
    val invalidPhoneError = localized("Enter a valid phone number with at least 7 digits.", "Voer 'n geldige telefoonnommer met minstens 7 syfers in.", "Faka inombolo yocingo evumelekile enezinombolo okungenani eziyi-7.")

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
                phoneInputRejected = false
                firstNameInputRejected = false
                lastNameInputRejected = false
                error = null
                notice = null
            },
            initialEmail = email,
            notice = notice,
            onLanguageChanged = onLanguageChanged,
            onFingerprintUnlock = onFingerprintUnlock
        )

        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090909))
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
            text = localized("Create your account", "Skep jou rekening", "Dala i-akhawunti yakho"),
            style = MaterialTheme.typography.titleLarge
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (signUpMode) {
            OutlinedTextField(
                value = firstName,
                onValueChange = { rawValue ->
                    val cleaned = sanitizePersonName(rawValue)
                    firstNameInputRejected = rawValue != cleaned
                    firstName = cleaned
                    error = null
                },
                label = { Text(localized("First name", "Voornaam", "Igama lokuqala")) },
                isError = firstNameInputRejected || (firstName.isNotEmpty() && !isValidPersonName(firstName)),
                supportingText = {
                    if (firstNameInputRejected || (firstName.isNotEmpty() && !isValidPersonName(firstName))) {
                        Text(localized("Use letters only in your name.", "Gebruik slegs letters in jou naam.", "Sebenzisa izinhlamvu kuphela egameni lakho."))
                    }
                },
                singleLine = true,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = lastName,
                onValueChange = { rawValue ->
                    val cleaned = sanitizePersonName(rawValue)
                    lastNameInputRejected = rawValue != cleaned
                    lastName = cleaned
                    error = null
                },
                label = { Text(localized("Last name", "Van", "Isibongo")) },
                isError = lastNameInputRejected || (lastName.isNotEmpty() && !isValidPersonName(lastName)),
                supportingText = {
                    if (lastNameInputRejected || (lastName.isNotEmpty() && !isValidPersonName(lastName))) {
                        Text(localized("Use letters only in your name.", "Gebruik slegs letters in jou naam.", "Sebenzisa izinhlamvu kuphela egameni lakho."))
                    }
                },
                singleLine = true,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = phone,
                onValueChange = { rawValue ->
                    val cleaned = sanitizePhoneNumber(rawValue)
                    phoneInputRejected = rawValue != cleaned
                    phone = cleaned
                    error = null
                },
                label = { Text(localized("Phone number — optional", "Telefoonnommer — opsioneel", "Inombolo yocingo — ngokuzithandela")) },
                isError = phoneInputRejected || (phone.isNotBlank() && !isValidPhoneNumber(phone)),
                supportingText = {
                    if (phoneInputRejected || (phone.isNotBlank() && !isValidPhoneNumber(phone))) {
                        Text(localized("Use digits, spaces, +, - or parentheses only.", "Gebruik slegs syfers, spasies, +, - of hakies.", "Sebenzisa izinombolo, izikhala, +, - noma abakaki kuphela."))
                    }
                },
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
                    label = { Text(localized("Athlete", "Atleet", "Umsubathi")) }
                )

                FilterChip(
                    selected = role == "guardian",
                    onClick = { role = "guardian" },
                    enabled = !busy,
                    label = { Text(localized("Parent / Guardian", "Ouer / Voog", "Umzali / Umnakekeli")) }
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
                label = { Text(localized("Date of birth", "Geboortedatum", "Usuku lokuzalwa")) },
                placeholder = { Text("YYYY-MM-DD") },
                supportingText = {
                    Text(localized("You must be 18 or older to register as an athlete.", "Jy moet 18 of ouer wees om as 'n atleet te registreer.", "Kufanele ube neminyaka engu-18 noma ngaphezulu ukuze ubhalise njengomsubathi."))
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
            label = { Text(tr("email")) },
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
            label = { Text(tr("password")) },
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
                label = { Text(localized("Confirm password", "Bevestig wagwoord", "Qinisekisa iphasiwedi")) },
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
                    text = localized("I agree to the club's terms and privacy policy", "Ek stem in tot die klub se bepalings en privaatheidsbeleid", "Ngiyavumelana nemigomo yeklabhu nenqubomgomo yobumfihlo"),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White,
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
                    !isValidPersonName(firstName) || !isValidPersonName(lastName) ->
                        invalidNameError

                    !isValidEmailAddress(email) ->
                        invalidEmailError

                    phone.isNotBlank() && !isValidPhoneNumber(phone) ->
                        invalidPhoneError

                    password.isBlank() ->
                        missingPasswordError

                    role == "athlete" && !isValidAdultDate(dateOfBirth) ->
                        invalidDateError

                    !isValidRegistrationPassword(password) ->
                        weakPasswordError

                    signUpMode && password != confirmPassword ->
                        mismatchPasswordError

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
                                        confirmationNotice
                                }
                            } else {
                                SupabaseAuth.login(email, password)
                            }
                        } catch (cancelled: CancellationException) {
                            throw cancelled
                        } catch (failure: Exception) {
                            error = if (failure is IOException) {
                                connectionError
                            } else {
                                failure.message ?: authenticationFailedError
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
                Text(if (signUpMode) localized("CREATE ACCOUNT", "SKEP REKENING", "DALA I-AKHAWUNTI") else tr("login").uppercase())
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
                    localized("Already have an account? Log in", "Het jy reeds 'n rekening? Meld aan", "Usunayo i-akhawunti? Ngena")
                } else {
                    localized("Don't have an account? Sign up", "Het jy nie 'n rekening nie? Registreer", "Awunayo i-akhawunti? Bhalisa")
                }
            )
        }
    }
}
