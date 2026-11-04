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
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

@Composable
fun ContactEnquiryForm(initialMessage: String = "") {
    val owner = SupabaseAuth.accountId
    var verificationAttempt by remember { mutableStateOf(0) }
    var verifying by remember { mutableStateOf(owner == null) }
    LaunchedEffect(owner, verificationAttempt) {
        if (owner == null) {
            verifying = true
            try { SupabaseAuth.accessToken() }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (failure: Exception) { reportFailure("Restore enquiry account", failure) }
            finally { verifying = false }
        }
    }
    if (owner == null) {
        if (verifying) {
            CircularProgressIndicator()
        } else {
            Text(localized("Could not verify your account. Check your connection and try again, or sign out and sign back in.", "Kon nie jou rekening bevestig nie. Gaan jou verbinding na en probeer weer, of meld af en weer aan.", "I-akhawunti yakho ayiqinisekiswanga. Hlola uxhumano bese uzama futhi, noma uphume uphinde ungene."), color = MaterialTheme.colorScheme.error)
            TextButton(onClick = { verificationAttempt++ }) { Text(localized("Retry", "Probeer weer", "Zama futhi")) }
        }
        return
    }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var message by rememberSaveable(initialMessage) { mutableStateOf(initialMessage) }
    var sending by remember { mutableStateOf(false) }
    var outcome by rememberSaveable { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current.applicationContext
    val invalidName = localized("Enter your name (up to 100 characters).", "Voer jou naam in (hoogstens 100 karakters).", "Faka igama lakho (izinhlamvu ezingadluli kweziyi-100).")
    val invalidEmail = localized("Enter a valid email address.", "Voer 'n geldige e-posadres in.", "Faka ikheli le-imeyili elivumelekile.")
    val invalidPhone = localized("Enter a valid phone number, or leave it blank.", "Voer 'n geldige telefoonnommer in, of laat dit leeg.", "Faka inombolo yocingo evumelekile noma uyishiye ingenalutho.")
    val invalidMessage = localized("Your message must contain 5–3,000 characters.", "Jou boodskap moet 5–3 000 karakters bevat.", "Umlayezo wakho kufanele ube nezinhlamvu ezi-5–3 000.")
    val notSaved = localized("Could not save your enquiry on this device. Your message is still in the form.", "Kon nie jou navraag op hierdie toestel stoor nie. Jou boodskap is steeds in die vorm.", "Umbuzo wakho awugcinwanga kule divayisi. Umlayezo wakho usesefomini.")
    val notScheduled = localized("Your enquiry was saved, but syncing could not start. Use Retry sync in the outbox; do not submit it again.", "Jou navraag is gestoor, maar sinkronisering kon nie begin nie. Probeer sinkronisering in die uitboks; moenie weer indien nie.", "Umbuzo wakho ugciniwe, kodwa ukuvumelanisa akuqalanga. Zama ukuvumelanisa ebhokisini lemibuzo; ungaphindi uthumele.")
    val validation = when {
        !isValidPersonName(name, InputLimits.CONTACT_NAME) -> invalidName
        !isValidEmailAddress(email) -> invalidEmail
        phone.isNotBlank() && !isValidPhoneNumber(phone) -> invalidPhone
        message.trim().length !in 5..InputLimits.CONTACT_MESSAGE || '\u0000' in message -> invalidMessage
        else -> null
    }

    WrjaContentCard(Modifier.fillMaxWidth().wrjaReveal()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(localized("SEND US A MESSAGE", "STUUR ONS 'N BOODSKAP", "SITHUMELE UMLAYEZO"), color = WrjaGold, fontWeight = FontWeight.ExtraBold)
            Text(localized("Send an enquiry to the WRJA administration team. We will reply using your email address.", "Stuur 'n navraag aan die WRJA-administrasiespan. Ons sal via jou e-posadres antwoord.", "Thumela umbuzo ethimbeni labaphathi be-WRJA. Sizophendula sisebenzisa ikheli lakho le-imeyili."), color = WrjaMuted)
            OutlinedTextField(name, { name = editPersonName(name, it, InputLimits.CONTACT_NAME); outcome = null }, label = { Text(localized("Your name", "Jou naam", "Igama lakho")) }, enabled = !sending, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(email, { email = boundedInput(email, it, InputLimits.EMAIL); outcome = null }, label = { Text(tr("email")) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), enabled = !sending, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(phone, { phone = editPhoneNumber(phone, it); outcome = null }, label = { Text(localized("Phone number (optional)", "Telefoonnommer (opsioneel)", "Inombolo yocingo (ngokuzithandela)")) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), enabled = !sending, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(message, { message = boundedInput(message, it.replace("\u0000", ""), InputLimits.CONTACT_MESSAGE); outcome = null }, label = { Text(localized("Message", "Boodskap", "Umlayezo")) }, minLines = 4, enabled = !sending, modifier = Modifier.fillMaxWidth())
            outcome?.let { code ->
                Text(when (code) {
                    "notSaved" -> notSaved
                    "notScheduled" -> notScheduled
                    "queued" -> localized("Saved on this device. Your enquiry will send automatically when internet is available. Check the outbox below for delivery status.", "Op hierdie toestel gestoor. Jou navraag sal outomaties stuur wanneer internet beskikbaar is. Sien die uitboks hieronder vir afleweringstatus.", "Kugcinwe kule divayisi. Umbuzo wakho uzothunyelwa ngokuzenzakalela uma i-inthanethi itholakala. Hlola isimo ngezansi.")
                    else -> validation.orEmpty()
                }, color = if (code == "queued") WrjaGold else MaterialTheme.colorScheme.error)
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
                                val id = recoverOperation("Save enquiry", { null }) {
                                    withContext(Dispatchers.IO) {
                                        ContactOutbox(context).use { it.add(owner, name, email, phone, message) }
                                    }
                                }
                                if (id == null) {
                                    outcome = "notSaved"
                                } else {
                                    message = ""
                                    outcome = recoverOperation("Schedule enquiry", { "notScheduled" }) {
                                        ContactOutbox.schedule(context, id)
                                        "queued"
                                    }
                                }
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
            androidx.compose.runtime.key(owner) { ContactOutboxStatus(owner) }
        }
    }
}
