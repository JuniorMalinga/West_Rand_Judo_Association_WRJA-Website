package za.co.wrja.mobile

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject

@Composable
fun PasswordResetDialog(initialEmail: String, onDismiss: () -> Unit) {
    // Intentionally not saveable: codes, passwords and recovery tokens never go to disk.
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf(initialEmail) }
    var phone by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var resetToken by remember { mutableStateOf("") }
    var step by remember { mutableStateOf(0) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var resendAt by remember { mutableStateOf(0L) }
    var expiresAt by remember { mutableStateOf(0L) }
    var now by remember { mutableStateOf(System.currentTimeMillis()) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) { while (true) { now = System.currentTimeMillis(); delay(1000) } }
    val cooldown = ((resendAt - now + 999) / 1000).coerceAtLeast(0)
    val expiry = ((expiresAt - now + 999) / 1000).coerceAtLeast(0)
    val invalidDetails = localized("Enter your account's full name, a valid email, and a valid phone number if provided.", "Voer jou rekening se volle naam, 'n geldige e-posadres en 'n geldige telefoonnommer indien verskaf in.", "Faka igama eligcwele le-akhawunti, i-imeyili evumelekile nenombolo yocingo evumelekile uma uyinikeza.")
    val invalidCode = localized("Enter the 6–12 digit code from your email before it expires.", "Voer die 6–12 syferkode uit jou e-pos in voordat dit verval.", "Faka ikhodi yezinombolo ezi-6–12 evela ku-imeyili ngaphambi kokuphelelwa isikhathi.")
    val invalidPassword = localized("Use at least 8 characters with a letter and a number. Both passwords must match.", "Gebruik minstens 8 karakters met 'n letter en syfer. Albei wagwoorde moet ooreenstem.", "Sebenzisa izinhlamvu okungenani eziyi-8 ezinohlamvu nenombolo. Amaphasiwedi kufanele afane.")
    val connectionError = localized("Could not confirm the request. Check your connection and email before trying again.", "Kon nie die versoek bevestig nie. Gaan jou verbinding en e-pos na voordat jy weer probeer.", "Asikwazanga ukuqinisekisa isicelo. Hlola uxhumano ne-imeyili ngaphambi kokuzama futhi.")
    val unavailable = localized("Password recovery is temporarily unavailable. Please try again later.", "Wagwoordherstel is tydelik onbeskikbaar. Probeer later weer.", "Ukubuyisela iphasiwedi akutholakali okwamanje. Zama kamuva.")
    val rejected = localized("The details or code could not be verified. Check your account details or request a new code.", "Die besonderhede of kode kon nie bevestig word nie. Gaan jou rekeningbesonderhede na of versoek 'n nuwe kode.", "Imininingwane noma ikhodi ayiqinisekiswanga. Hlola imininingwane ye-akhawunti noma ucele ikhodi entsha.")
    val limited = localized("Too many attempts. Please wait before trying again.", "Te veel pogings. Wag asseblief voordat jy weer probeer.", "Imizamo miningi kakhulu. Linda ngaphambi kokuzama futhi.")
    val reused = localized("Choose a password different from your current password.", "Kies 'n wagwoord wat van jou huidige wagwoord verskil.", "Khetha iphasiwedi ehlukile kweyamanje.")

    fun submit(action: String) {
        if (busy) return
        error = when {
            action == "request" && (!isValidPersonName(name) || name.trim().length > 120 || !isValidEmailAddress(email) || (phone.isNotBlank() && !isValidPhoneNumber(phone))) -> invalidDetails
            action == "verify" && (code.length !in 6..12 || expiry == 0L) -> invalidCode
            action == "complete" && (password.length !in 8..128 || !password.any { it in 'A'..'Z' || it in 'a'..'z' } || !password.any { it in '0'..'9' } || password != confirm) -> invalidPassword
            else -> null
        }
        if (error != null) return
        busy = true
        scope.launch {
            try {
                val payload = JSONObject().put("email", email.trim())
                when (action) {
                    "request" -> payload.put("fullName", name.trim()).put("phone", phone.trim())
                    "verify" -> payload.put("code", code)
                    "complete" -> payload.put("resetToken", resetToken).put("newPassword", password)
                }
                val result = PasswordResetApi.post(action, payload)
                when (action) {
                    "request" -> {
                        val sentAt = System.currentTimeMillis()
                        resendAt = sentAt + result.optLong("resendAfterSeconds", 30) * 1000
                        expiresAt = sentAt + result.optLong("expiresInSeconds", 600) * 1000
                        code = ""
                        step = 1
                    }
                    "verify" -> {
                        resetToken = result.optString("resetToken")
                        check(resetToken.isNotBlank())
                        code = ""
                        step = 2
                    }
                    "complete" -> {
                        resetToken = ""
                        password = ""
                        confirm = ""
                        step = 3
                    }
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: PasswordResetFailure) {
                if (failure.retryAfter > 0) resendAt = System.currentTimeMillis() + failure.retryAfter * 1000L
                error = when {
                    failure.status == 429 -> limited
                    failure.status >= 500 -> unavailable
                    failure.reason.contains("different from") -> reused
                    else -> rejected
                }
            } catch (_: Exception) {
                error = connectionError
            } finally { busy = false }
        }
    }

    BackHandler(enabled = busy) { /* Do not abandon an in-flight password update. */ }
    AlertDialog(
        onDismissRequest = { if (!busy) onDismiss() },
        title = { Text(localized("Reset password", "Herstel wagwoord", "Setha kabusha iphasiwedi")) },
        text = {
            Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                when (step) {
                    0 -> {
                        Text(localized("Enter your registered details. A reset code will be sent to your email.", "Voer jou geregistreerde besonderhede in. 'n Herstelkode sal na jou e-pos gestuur word.", "Faka imininingwane obhalise ngayo. Ikhodi izothunyelwa ku-imeyili yakho."))
                        OutlinedTextField(name, { name = sanitizePersonName(it); error = null }, label = { Text(localized("Full name", "Volle naam", "Igama eligcwele")) }, singleLine = true, enabled = !busy)
                        OutlinedTextField(email, { email = it; error = null }, label = { Text(tr("email")) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), singleLine = true, enabled = !busy)
                        OutlinedTextField(phone, { phone = sanitizePhoneNumber(it); error = null }, label = { Text(localized("Phone (optional)", "Telefoon (opsioneel)", "Ucingo (ngokuzithandela)")) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), singleLine = true, enabled = !busy)
                    }
                    1 -> {
                        Text(localized("Check your email and spam folder for the reset code.", "Gaan jou e-pos en strooiposvouer na vir die herstelkode.", "Hlola i-imeyili nefolda yogaxekile ukuze uthole ikhodi."))
                        Text(email)
                        Text("${localized("Code expires in", "Kode verval oor", "Ikhodi iphelelwa yisikhathi ngo")}: ${expiry / 60}:${(expiry % 60).toString().padStart(2, '0')}")
                        OutlinedTextField(code, { code = it.filter(Char::isDigit).take(12); error = null }, label = { Text(localized("Email code", "E-poskode", "Ikhodi ye-imeyili")) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword), singleLine = true, enabled = !busy)
                        TextButton(onClick = { submit("request") }, enabled = !busy && cooldown == 0L) { Text(localized("Resend code", "Stuur kode weer", "Thumela ikhodi futhi") + if (cooldown > 0) " (${cooldown}s)" else "") }
                        TextButton(onClick = { step = 0; code = ""; error = null }, enabled = !busy) { Text(localized("Edit account details", "Wysig rekeningbesonderhede", "Hlela imininingwane ye-akhawunti")) }
                    }
                    2 -> {
                        Text(localized("Email verified. Choose a new password different from your current one.", "E-pos bevestig. Kies 'n nuwe wagwoord wat van jou huidige een verskil.", "I-imeyili iqinisekisiwe. Khetha iphasiwedi entsha ehlukile kweyamanje."))
                        OutlinedTextField(password, { password = it; error = null }, label = { Text(tr("password")) }, visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password), enabled = !busy, singleLine = true)
                        OutlinedTextField(confirm, { confirm = it; error = null }, label = { Text(localized("Confirm password", "Bevestig wagwoord", "Qinisekisa iphasiwedi")) }, visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password), enabled = !busy, singleLine = true)
                        Text(invalidPassword)
                        TextButton(enabled = !busy, onClick = {
                            resetToken = ""; password = ""; confirm = ""; error = null; step = 0
                        }) { Text(localized("Start again", "Begin weer", "Qala futhi")) }
                    }
                    else -> Text(localized("Your password has been reset. Return to login and sign in with your new password.", "Jou wagwoord is herstel. Keer terug en meld met jou nuwe wagwoord aan.", "Iphasiwedi yakho isethwe kabusha. Buyela ekungeneni usebenzise iphasiwedi entsha."))
                }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                if (busy) CircularProgressIndicator(Modifier.size(24.dp))
            }
        },
        confirmButton = {
            TextButton(enabled = !busy && (step != 0 || cooldown == 0L), onClick = {
                when (step) { 0 -> submit("request"); 1 -> submit("verify"); 2 -> submit("complete"); else -> onDismiss() }
            }) { Text(when (step) {
                0 -> localized("Send reset code", "Stuur herstelkode", "Thumela ikhodi")
                1 -> localized("Verify code", "Bevestig kode", "Qinisekisa ikhodi")
                2 -> localized("Save password", "Stoor wagwoord", "Londoloza iphasiwedi")
                else -> tr("login")
            }) }
        },
        dismissButton = { if (step != 3) TextButton(enabled = !busy, onClick = onDismiss) { Text(localized("Cancel", "Kanselleer", "Khansela")) } }
    )
}
