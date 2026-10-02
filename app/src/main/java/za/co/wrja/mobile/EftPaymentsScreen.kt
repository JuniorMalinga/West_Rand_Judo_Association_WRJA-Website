package za.co.wrja.mobile

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import java.io.IOException


@Composable
fun EftPaymentsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var competitions by remember { mutableStateOf<List<EftCompetition>>(emptyList()) }
    var payments by remember { mutableStateOf<List<EftPayment>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var refresh by remember { mutableStateOf(0) }
    var loadError by remember { mutableStateOf<String?>(null) }
    // null = competition list; empty string = Other / not listed.
    var selectedId by rememberSaveable { mutableStateOf<String?>(null) }
    var file by remember(selectedId) { mutableStateOf<EftProofFile?>(null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember(selectedId) { mutableStateOf<String?>(null) }
    var notice by remember(selectedId) { mutableStateOf<String?>(null) }

    fun back() {
        if (!busy) {
            if (selectedId != null) selectedId = null else onBack()
        }
    }
    BackHandler { back() }

    LaunchedEffect(refresh) {
        loading = true
        loadError = null
        try {
            competitions = SupabasePayments.competitions()
        } catch (cancelled: CancellationException) { throw cancelled }
        catch (failure: Exception) { loadError = eftError(failure) }
        try {
            payments = SupabasePayments.mine()
        } catch (cancelled: CancellationException) { throw cancelled }
        catch (failure: Exception) {
            loadError = listOfNotNull(loadError, "History: ${eftError(failure)}").joinToString("\n")
        } finally { loading = false }
    }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            busy = true
            error = null
            notice = null
            file = null
            scope.launch {
                try {
                    file = EftProofFiles.read(context.applicationContext, uri)
                } catch (cancelled: CancellationException) { throw cancelled }
                catch (failure: Exception) { error = eftError(failure) }
                finally { busy = false }
            }
        }
    }

    val competition = competitions.firstOrNull { it.id == selectedId }
    val other = selectedId == ""

    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        TextButton(onClick = { back() }, enabled = !busy) {
            Text(if (selectedId == null) "← Back to Events" else "← Back to payments")
        }
        Text("EFT payments", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("Make the EFT through your bank, then upload your confirmation for WRJA to review.")

        if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        loadError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        TextButton(onClick = { refresh++ }, enabled = !loading && !busy) { Text("Refresh payments and status") }

        if (selectedId == null) {
            if (!loading && loadError == null && competitions.isEmpty()) {
                Text("No published competitions requiring payment are available yet.")
            }
            competitions.forEach { item ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Date: ${item.date}")
                        Button(onClick = { selectedId = item.id }, enabled = !busy && !loading) {
                            Text("Payment details / Upload proof")
                        }
                    }
                }
            }
            OutlinedButton(onClick = { selectedId = "" }, enabled = !busy) {
                Text("Other / not listed — upload proof")
            }
        } else if (other || competition != null) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(competition?.title ?: "Other / not listed",
                        style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("Payment details", fontWeight = FontWeight.Bold)
                    Text(competition?.instructions?.takeIf { it.isNotBlank() }
                        ?: "Payment details have not been published here. Contact WRJA to confirm the banking details and reference before paying.")
                    if (!competition?.paymentUrl.isNullOrBlank()) {
                        OutlinedButton(onClick = {
                            try { openEftLink(context, competition!!.paymentUrl) }
                            catch (failure: Exception) { error = eftError(failure) }
                        }, enabled = !busy) { Text("Open payment link") }
                    }
                    HorizontalDivider()
                    Text("Upload Proof of Payment", style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold)
                    Text("PDF up to 4 MB, or JPG/PNG. Images are resized for upload.")
                    Text(file?.let { "${it.name} (${(it.bytes.size + 1023) / 1024} KB)" }
                        ?: "No file selected")
                    OutlinedButton(onClick = {
                        picker.launch(arrayOf("application/pdf", "image/jpeg", "image/png"))
                    }, enabled = !busy) { Text("Choose payment confirmation") }
                    Button(onClick = {
                        val chosen = file ?: return@Button
                        busy = true
                        error = null
                        notice = null
                        scope.launch {
                            try {
                                SupabasePayments.submit(chosen, competition)
                                file = null
                                notice = "Proof of Payment uploaded — WRJA will review it shortly."
                                refresh++
                            } catch (cancelled: CancellationException) { throw cancelled }
                            catch (failure: Exception) {
                                error = eftError(failure) +
                                    " Refresh your submissions before retrying. If it is missing, retry with the same selected file."
                            } finally { busy = false }
                        }
                    }, enabled = file != null && !busy && !loading) {
                        Text(if (busy) "Please wait…" else "Submit Proof of Payment")
                    }
                }
            }
        } else if (!loading) {
            Text("This competition is no longer available for payment. Go back and refresh the list.")
        }

        if (busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        notice?.let { Text(it, color = MaterialTheme.colorScheme.primary) }

        Text("Your submissions", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        val visible = payments.filter { selectedId == null || it.eventId == selectedId }
        if (!loading && visible.isEmpty()) Text("No submissions to show.")
        visible.forEach { payment ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(payment.paymentFor, fontWeight = FontWeight.Bold)
                    Text(payment.fileName)
                    Text("Submitted: ${payment.uploadedAt.replace('T', ' ').take(16)} UTC",
                        style = MaterialTheme.typography.bodySmall)
                    Text(payment.statusLabel, fontWeight = FontWeight.Bold,
                        color = if (payment.status == "rejected") MaterialTheme.colorScheme.error
                            else MaterialTheme.colorScheme.primary)
                    TextButton(onClick = {
                        busy = true
                        error = null
                        scope.launch {
                            try { openEftLink(context, SupabasePayments.proofUrl(payment)) }
                            catch (cancelled: CancellationException) { throw cancelled }
                            catch (failure: Exception) { error = eftError(failure) }
                            finally { busy = false }
                        }
                    }, enabled = !busy) { Text("Open proof") }
                }
            }
        }
    }
}

private fun openEftLink(context: Context, address: String) {
    val uri = Uri.parse(address.trim())
    require(uri.scheme in listOf("https", "http") && !uri.host.isNullOrBlank() && uri.userInfo == null) {
        "That link is invalid. Contact WRJA for the correct link."
    }
    context.startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
}

private fun eftError(failure: Exception): String = when (failure) {
    is IOException -> "Could not connect. Check your internet connection."
    is android.content.ActivityNotFoundException -> "No app is available to open this link."
    is IllegalArgumentException, is IllegalStateException -> failure.message ?: "The payment action failed."
    else -> "The payment action failed. Please retry."
}
