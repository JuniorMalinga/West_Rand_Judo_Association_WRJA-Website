package za.co.wrja.mobile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

@Composable
fun ContactEnquiryForm() {
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var message by rememberSaveable { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var outcome by rememberSaveable { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val invalidName = localized("Enter your name (2–100 characters).", "Voer jou naam in (2–100 karakters).", "Faka igama lakho (izinhlamvu ezi-2–100).")
    val invalidEmail = localized("Enter a valid email address.", "Voer 'n geldige e-posadres in.", "Faka ikheli le-imeyili elivumelekile.")
    val invalidPhone = localized("Enter a valid phone number, or leave it blank.", "Voer 'n geldige telefoonnommer in, of laat dit leeg.", "Faka inombolo yocingo evumelekile noma uyishiye ingenalutho.")
    val invalidMessage = localized("Your message must contain 5–3,000 characters.", "Jou boodskap moet 5–3 000 karakters bevat.", "Umlayezo wakho kufanele ube nezinhlamvu ezi-5–3 000.")
    val savedWithEmail = localized("Your message has been sent to WRJA. A confirmation email has been sent to your email address.", "Jou boodskap is aan WRJA gestuur. 'n Bevestigings-e-pos is na jou e-posadres gestuur.", "Umlayezo wakho uthunyelwe ku-WRJA. I-imeyili yokuqinisekisa ithunyelwe ekhelini lakho.")
    val savedOnly = localized("WRJA has received your message. The confirmation email could not be sent; you do not need to submit again.", "WRJA het jou boodskap ontvang. Die bevestigings-e-pos kon nie gestuur word nie; jy hoef nie weer in te dien nie.", "I-WRJA iwutholile umlayezo wakho. I-imeyili yokuqinisekisa ayithunyelwanga; awudingi ukuthumela futhi.")
    val retryLater = localized("Too many messages. Please wait before trying again.", "Te veel boodskappe. Wag asseblief voordat jy weer probeer.", "Imilayezo miningi kakhulu. Linda ngaphambi kokuzama futhi.")
    val failed = localized("Your message was not accepted. Please check the details and try again later.", "Jou boodskap is nie aanvaar nie. Gaan die besonderhede na en probeer later weer.", "Umlayezo wakho awamukelwanga. Hlola imininingwane bese uzama kamuva.")
    val uncertain = localized("We could not confirm delivery. Your text is kept below. Check your connection and confirmation email before retrying, to avoid duplicate messages.", "Ons kon aflewering nie bevestig nie. Jou teks is hieronder behou. Gaan jou verbinding en bevestigings-e-pos na voordat jy weer probeer om duplikate te vermy.", "Asikwazanga ukuqinisekisa ukuthunyelwa. Umbhalo wakho ugcinwe ngezansi. Hlola uxhumano ne-imeyili yokuqinisekisa ngaphambi kokuzama futhi ukuze ugweme ukuphinda umlayezo.")
    val validation = when {
        name.trim().length !in 2..100 || !isValidPersonName(name) -> invalidName
        !isValidEmailAddress(email) || email.trim().length > 254 -> invalidEmail
        phone.isNotBlank() && !isValidPhoneNumber(phone) -> invalidPhone
        message.trim().length !in 5..3000 -> invalidMessage
        else -> null
    }

    WrjaContentCard(Modifier.fillMaxWidth().wrjaReveal()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(localized("SEND US A MESSAGE", "STUUR ONS 'N BOODSKAP", "SITHUMELE UMLAYEZO"), color = WrjaGold, fontWeight = FontWeight.ExtraBold)
            Text(localized("Send an enquiry to the WRJA administration team. We will reply using your email address.", "Stuur 'n navraag aan die WRJA-administrasiespan. Ons sal via jou e-posadres antwoord.", "Thumela umbuzo ethimbeni labaphathi be-WRJA. Sizophendula sisebenzisa ikheli lakho le-imeyili."), color = WrjaMuted)
            OutlinedTextField(name, { name = sanitizePersonName(it); outcome = null }, label = { Text(localized("Your name", "Jou naam", "Igama lakho")) }, enabled = !sending, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(email, { email = it; outcome = null }, label = { Text(tr("email")) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), enabled = !sending, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(phone, { phone = sanitizePhoneNumber(it); outcome = null }, label = { Text(localized("Phone number (optional)", "Telefoonnommer (opsioneel)", "Inombolo yocingo (ngokuzithandela)")) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), enabled = !sending, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(message, { message = it; outcome = null }, label = { Text(localized("Message", "Boodskap", "Umlayezo")) }, minLines = 4, enabled = !sending, modifier = Modifier.fillMaxWidth())
            outcome?.let { code ->
                Text(when (code) {
                    "email" -> savedWithEmail
                    "saved" -> savedOnly
                    "rate" -> retryLater
                    "failed" -> failed
                    "uncertain" -> uncertain
                    else -> validation.orEmpty()
                }, color = if (code == "email" || code == "saved") WrjaGold else MaterialTheme.colorScheme.error)
            }
            Button(
                enabled = !sending,
                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = WrjaGold, contentColor = Color.Black),
                onClick = {
                    if (validation != null) outcome = "validation" else {
                        sending = true
                        outcome = null
                        scope.launch {
                            try {
                                val emailSent = WebsiteContactApi.submit(name, email, phone, message)
                                message = ""
                                outcome = if (emailSent) "email" else "saved"
                            } catch (cancelled: CancellationException) {
                                throw cancelled
                            } catch (rejected: ContactRejectedException) {
                                outcome = if (rejected.status == 429) "rate" else "failed"
                            } catch (_: Exception) {
                                outcome = "uncertain"
                            } finally {
                                sending = false
                            }
                        }
                    }
                }
            ) {
                if (sending) CircularProgressIndicator(Modifier.size(20.dp), color = Color.Black, strokeWidth = 2.dp)
                else Text(localized("SEND MESSAGE", "STUUR BOODSKAP", "THUMELA UMLAYEZO"), fontWeight = FontWeight.Bold)
            }
        }
    }
}
