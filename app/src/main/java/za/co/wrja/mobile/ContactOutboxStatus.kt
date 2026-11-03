package za.co.wrja.mobile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.*

@Composable
fun ContactOutboxStatus() {
    val context = LocalContext.current.applicationContext
    val scope = rememberCoroutineScope()
    var entries by remember { mutableStateOf(emptyList<OutboxEntry>()) }
    var pendingDelete by remember { mutableStateOf<String?>(null) }
    var draft by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) {
        while (true) {
            entries = withContext(Dispatchers.IO) { ContactOutbox(context).use { it.entries() } }
            delay(2000)
        }
    }
    if (entries.isEmpty()) return
    Text(localized("Enquiry outbox", "Navraag-uitboks", "Ibhokisi lemibuzo"), color = WrjaGold)
    entries.forEach { entry ->
        Column(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
            Text("#${entry.id.take(8)} · " + when (entry.status) {
                "queued" -> localized("Queued — sends when connected", "In tou — stuur wanneer gekoppel", "Kulindile — kuthunyelwa uma kuxhunyiwe")
                "sending" -> localized("Sending…", "Stuur…", "Kuyathunyelwa…")
                "sent_email" -> localized("Delivered; confirmation email sent", "Afgelewer; bevestigings-e-pos gestuur", "Kuthunyelwe; i-imeyili yokuqinisekisa ithunyelwe")
                "sent" -> localized("Delivered; confirmation email unavailable", "Afgelewer; bevestigings-e-pos onbeskikbaar", "Kuthunyelwe; i-imeyili yokuqinisekisa ayitholakali")
                "rejected" -> localized("Rejected — check details and submit a corrected enquiry", "Geweier — gaan besonderhede na en dien 'n reggestelde navraag in", "Kwenqatshiwe — hlola imininingwane bese uthumela umbuzo olungisiwe")
                else -> localized("Delivery uncertain. Check your email or contact WRJA before resending to avoid duplicates.", "Aflewering onseker. Gaan jou e-pos na of kontak WRJA voordat jy weer stuur om duplikate te vermy.", "Ukuthunyelwa akuqinisekisiwe. Hlola i-imeyili noma uxhumane ne-WRJA ngaphambi kokuthumela futhi ukuze ugweme ukuphinda.")
            }, style = MaterialTheme.typography.bodySmall)
            if (!entry.status.startsWith("sent")) TextButton(onClick = {
                scope.launch { draft = withContext(Dispatchers.IO) { ContactOutbox(context).use { it.draft(entry.id) } } }
            }) { Text(localized("View saved message", "Bekyk gestoorde boodskap", "Bona umlayezo ogciniwe")) }
            if (entry.status != "sending") TextButton(onClick = { pendingDelete = entry.id }) {
                Text(localized("Remove from device", "Verwyder van toestel", "Susa kudivayisi"))
            }
        }
    }
    draft?.let { text ->
        AlertDialog(onDismissRequest = { draft = null },
            title = { Text(localized("Saved enquiry", "Gestoorde navraag", "Umbuzo ogciniwe")) },
            text = { SelectionContainer { Text(text) } },
            confirmButton = { TextButton(onClick = { draft = null }) { Text(localized("Close", "Sluit", "Vala")) } })
    }
    pendingDelete?.let { id ->
        AlertDialog(onDismissRequest = { pendingDelete = null },
            title = { Text(localized("Remove enquiry?", "Verwyder navraag?", "Susa umbuzo?")) },
            text = { Text(localized("This cancels a queued enquiry or removes its local record. It cannot recall an already delivered message.", "Dit kanselleer 'n navraag in die tou of verwyder die plaaslike rekord. Dit kan nie 'n afgelewerde boodskap herroep nie.", "Lokhu kukhansela umbuzo olindile noma kususe irekhodi lendawo. Akukwazi ukubuyisa umlayezo osuthunyelwe.")) },
            confirmButton = { TextButton(onClick = {
                pendingDelete = null
                scope.launch(Dispatchers.IO) {
                    val removed = ContactOutbox(context).use { it.delete(id) }
                    if (removed) androidx.work.WorkManager.getInstance(context).cancelUniqueWork("contact-$id")
                }
            }) { Text(localized("Remove", "Verwyder", "Susa")) } },
            dismissButton = { TextButton(onClick = { pendingDelete = null }) { Text(localized("Cancel", "Kanselleer", "Khansela")) } })
    }
}
