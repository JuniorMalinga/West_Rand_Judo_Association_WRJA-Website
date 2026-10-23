package za.co.wrja.mobile

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.util.Patterns
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.UUID
import java.util.TimeZone
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

private val BookGold = Color(0xFFF1BD16)
private val BookFieldBackground = Color(0xFF242424)

@Composable
fun BookScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var programId by rememberSaveable { mutableStateOf("") }
    var fullName by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var paymentMethod by rememberSaveable { mutableStateOf("") }
    var dateMillis by rememberSaveable { mutableStateOf<Long?>(null) }
    var hour by rememberSaveable { mutableStateOf(-1) }
    var minute by rememberSaveable { mutableStateOf(0) }
    var notes by rememberSaveable { mutableStateOf("") }

    var error by remember { mutableStateOf<String?>(null) }
    var submitting by remember { mutableStateOf(false) }
    var bookingSent by rememberSaveable { mutableStateOf(false) }
    var requestId by rememberSaveable(
        programId, fullName, email, phone, paymentMethod,
        dateMillis, hour, minute, notes
    ) { mutableStateOf(UUID.randomUUID().toString()) }
    val formEnabled = !submitting && !bookingSent
    var programs by remember { mutableStateOf<List<BookingProgram>>(emptyList()) }
    var programsLoading by remember { mutableStateOf(true) }
    var programsError by remember { mutableStateOf<String?>(null) }
    var programsReload by remember { mutableStateOf(0) }

    LaunchedEffect(SupabaseAuth.isLoggedIn, programsReload) {
        programsLoading = true
        programsError = null
        try {
            programs = SupabaseBookings.loadPrograms()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            programs = emptyList()
            programsError = failure.message ?: "Unable to load programs."
        } finally {
            programsLoading = false
        }
    }

    val dateText = dateMillis?.let {
        SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(Date(it))
    }.orEmpty()

    val timeText = if (hour >= 0) {
        String.format(Locale.ROOT, "%02d:%02d", hour, minute)
    } else {
        ""
    }

    Card(
        modifier = Modifier.fillMaxWidth().wrjaReveal(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF171717)
        ),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF393939)),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = localized("BOOK A SESSION", "BESPREEK 'N SESSIE", "BHUKHA ISESHINI"),
                color = BookGold,
                fontSize = 12.sp,
                fontWeight = FontWeight.ExtraBold
            )

            Text(text = localized("Request a booking", "Versoek 'n bespreking", "Cela ukubhukha"), color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)

            Text(
                text = localized("Choose a program and enter your preferred session details. Times are South African time.", "Kies 'n program en voer jou voorkeursessiebesonderhede in. Tye is Suid-Afrikaanse tyd.", "Khetha uhlelo bese ufaka imininingwane yeseshini oyithandayo. Izikhathi ezaseNingizimu Afrika."),
                color = Color.LightGray,
                fontSize = 13.sp
            )

            if (programsLoading) {
                Text(localized("Loading programs…", "Programme word gelaai…", "Kulayishwa izinhlelo…"), color = Color.LightGray)
            }
            programsError?.let { Text(it, color = Color(0xFFFFD1D1)) }
            if (!programsLoading && programs.isEmpty() && programsError == null) {
                Text(localized("No active programs are available for booking.", "Geen aktiewe programme is beskikbaar vir bespreking nie.", "Azikho izinhlelo ezisebenzayo ezitholakalayo zokubhukha."), color = Color.LightGray)
            }
            if (!programsLoading && programs.isEmpty() && !bookingSent) {
                TextButton(onClick = { programsReload++ }, enabled = !submitting) {
                    Text(localized("Retry loading programs", "Probeer weer om programme te laai", "Zama futhi ukulayisha izinhlelo"), color = BookGold)
                }
            }

            BookDropdown(
                enabled = formEnabled && !programsLoading && programs.isNotEmpty(),
                label = localized("Program", "Program", "Uhlelo"),
                value = programs.firstOrNull { it.id == programId }?.name.orEmpty(),
                placeholder = localized("Select a program", "Kies 'n program", "Khetha uhlelo"),
                options = programs.map { it.name },
                optionValues = programs.map { it.id },
                onSelected = { programId = it }
            )

            BookInput(
                enabled = formEnabled,
                label = localized("Full name", "Volle naam", "Igama eligcwele"),
                value = fullName,
                placeholder = localized("Your full name", "Jou volle naam", "Igama lakho eligcwele"),
                onValueChange = { fullName = it }
            )

            BookInput(
                enabled = formEnabled,
                label = tr("email"),
                value = email,
                placeholder = "you@example.com",
                keyboardType = KeyboardType.Email,
                onValueChange = { email = it }
            )

            BookInput(
                enabled = formEnabled,
                label = localized("Phone number", "Telefoonnommer", "Inombolo yocingo"),
                value = phone,
                placeholder = localized("Your phone number", "Jou telefoonnommer", "Inombolo yakho yocingo"),
                keyboardType = KeyboardType.Phone,
                onValueChange = { phone = it }
            )

            BookDropdown(
                enabled = formEnabled,
                label = localized("Payment method", "Betaalmetode", "Indlela yokukhokha"),
                value = paymentMethod,
                placeholder = localized("Select a payment method", "Kies 'n betaalmetode", "Khetha indlela yokukhokha"),
                options = listOf("EFT", "Cash", "Card"),
                onSelected = { paymentMethod = it }
            )

            Column {
                BookLabel(localized("Preferred date", "Voorkeurdatum", "Usuku oluthandwayo"))

                BookChoiceButton(
                    enabled = formEnabled,
                    text = dateText.ifBlank { localized("Select a date", "Kies 'n datum", "Khetha usuku") },
                    icon = Icons.Default.DateRange,
                    onClick = {
                        val calendar = Calendar.getInstance().apply {
                            dateMillis?.let { timeInMillis = it }
                        }

                        val picker = DatePickerDialog(
                            context,
                            { _, year, month, day ->
                                dateMillis = Calendar.getInstance().apply {
                                    clear()
                                    set(year, month, day)
                                }.timeInMillis
                            },
                            calendar.get(Calendar.YEAR),
                            calendar.get(Calendar.MONTH),
                            calendar.get(Calendar.DAY_OF_MONTH)
                        )

                        picker.datePicker.minDate =
                            System.currentTimeMillis()

                        picker.show()
                    }
                )
            }

            Column {
                BookLabel(localized("Preferred time", "Voorkeurtyd", "Isikhathi esithandwayo"))

                BookChoiceButton(
                    enabled = formEnabled,
                    text = timeText.ifBlank { localized("Select a time", "Kies 'n tyd", "Khetha isikhathi") },
                    icon = Icons.Default.Schedule,
                    onClick = {
                        TimePickerDialog(
                            context,
                            { _, selectedHour, selectedMinute ->
                                hour = selectedHour
                                minute = selectedMinute
                            },
                            if (hour >= 0) hour else 9,
                            minute,
                            true
                        ).show()
                    }
                )
            }

            BookInput(
                enabled = formEnabled,
                label = localized("Notes (optional)", "Notas (opsioneel)", "Amanothi (ngokuzithandela)"),
                value = notes,
                placeholder = localized("Anything we should know before your session", "Enigiets wat ons voor jou sessie moet weet", "Noma yini okufanele siyazi ngaphambi kweseshini yakho"),
                multiline = true,
                onValueChange = { notes = it }
            )

            error?.let {
                Text(
                    text = it,
                    color = Color(0xFFFFD1D1),
                    fontSize = 13.sp
                )
            }

            if (!SupabaseAuth.isLoggedIn) {
                Text(localized("Log in using the app menu before submitting.", "Meld aan met die app-kieslys voordat jy indien.", "Ngena usebenzisa imenyu yohlelo ngaphambi kokuthumela."), color = Color.LightGray)
            }

            Button(
                enabled = formEnabled && !programsLoading && programs.isNotEmpty(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(4.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BookGold,
                    contentColor = Color.Black
                ),
                onClick = {
                    if (submitting || bookingSent) return@Button

                    error = when {
                        !SupabaseAuth.isLoggedIn ->
                            "Please log in before requesting a booking."

                        programs.none { it.id == programId } ->
                            "Please select a program."

                        fullName.isBlank() ->
                            "Please enter your full name."

                        fullName.trim().length > 150 ->
                            "Please keep your name under 151 characters."

                        email.trim().length > 254 ->
                            "Please enter a shorter email address."

                        !Patterns.EMAIL_ADDRESS
                            .matcher(email.trim())
                            .matches() ->
                            "Please enter a valid email address."

                        phone.isBlank() ->
                            "Please enter your phone number."

                        phone.trim().length > 30 ->
                            "Please keep your phone number under 31 characters."

                        notes.trim().length > 2000 ->
                            "Please keep your notes under 2,001 characters."

                        paymentMethod.isBlank() ->
                            "Please select a payment method."

                        dateMillis == null ->
                            "Please select a preferred date."

                        hour < 0 ->
                            "Please select a preferred time."

                        !isFutureBooking(dateText, timeText) ->
                            "Please choose a future date and time (South African time)."

                        else -> null
                    }

                    if (error == null) {
                        val request = BookingRequest(
                            id = requestId,
                            programId = programId,
                            fullName = fullName.trim(),
                            email = email.trim(),
                            phone = phone.trim(),
                            paymentMethod = paymentMethod,
                            preferredDate = dateText,
                            preferredTime = timeText,
                            notes = notes.trim()
                        )
                        submitting = true
                        scope.launch {
                            try {
                                SupabaseBookings.submit(request)
                                bookingSent = true
                            } catch (cancelled: CancellationException) {
                                throw cancelled
                            } catch (failure: Exception) {
                                error = failure.message ?: "Unable to submit your booking."
                            } finally {
                                submitting = false
                            }
                        }
                    }
                }
            ) {
                Text(
                    if (submitting) localized("SENDING…", "STUUR…", "KUYATHUNYELWA…") else if (bookingSent) localized("REQUEST SENT", "VERSOEK GESTUUR", "ISICELO SITHUNYELWE") else localized("REQUEST BOOKING", "VERSOEK BESPREKING", "CELA UKUBHUKHA"),
                    fontWeight = FontWeight.Bold
                )
            }

            if (bookingSent) {
                Text(
                    text = localized("Your booking request has been sent. The club still needs to confirm your session. No payment has been taken.", "Jou besprekingsversoek is gestuur. Die klub moet nog jou sessie bevestig. Geen betaling is geneem nie.", "Isicelo sakho sokubhukha sithunyelwe. Iklabhu kusafanele iqinisekise iseshini yakho. Ayikho inkokhelo ethathiwe."),
                    color = Color.White,
                    fontSize = 13.sp
                )
                TextButton(onClick = {
                    programId = ""
                    fullName = ""
                    email = ""
                    phone = ""
                    paymentMethod = ""
                    dateMillis = null
                    hour = -1
                    minute = 0
                    notes = ""
                    requestId = UUID.randomUUID().toString()
                    bookingSent = false
                    error = null
                }) {
                    Text(localized("Make another request", "Maak nog 'n versoek", "Yenza esinye isicelo"), color = BookGold)
                }
            }
        }
    }
}

private fun isFutureBooking(date: String, time: String): Boolean {
    val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.ROOT).apply {
        isLenient = false
        timeZone = TimeZone.getTimeZone("Africa/Johannesburg")
    }
    return runCatching {
        (formatter.parse("$date $time")?.time ?: 0L) > System.currentTimeMillis()
    }.getOrDefault(false)
}

@Composable
private fun BookLabel(text: String) {
    Text(
        text = text,
        color = Color.White,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold
    )

    Spacer(Modifier.height(6.dp))
}

@Composable
private fun BookInput(
    label: String,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit,
    keyboardType: KeyboardType = KeyboardType.Text,
    multiline: Boolean = false,
    enabled: Boolean = true
) {
    Column {
        BookLabel(label)

        OutlinedTextField(
            enabled = enabled,
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = !multiline,
            minLines = if (multiline) 3 else 1,
            shape = RoundedCornerShape(14.dp),
            keyboardOptions = KeyboardOptions(
                keyboardType = keyboardType
            ),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedContainerColor = BookFieldBackground,
                unfocusedContainerColor = BookFieldBackground,
                focusedBorderColor = BookGold,
                unfocusedBorderColor = Color.Transparent,
                focusedPlaceholderColor = Color.LightGray,
                unfocusedPlaceholderColor = Color.LightGray,
                cursorColor = BookGold
            )
        )
    }
}

@Composable
private fun BookDropdown(
    label: String,
    value: String,
    placeholder: String,
    options: List<String>,
    onSelected: (String) -> Unit,
    optionValues: List<String> = options,
    enabled: Boolean = true
) {
    var expanded by remember { mutableStateOf(false) }

    Column {
        BookLabel(label)

        Box(Modifier.fillMaxWidth()) {
            BookChoiceButton(
                enabled = enabled,
                text = value.ifBlank { placeholder },
                icon = Icons.Default.ArrowDropDown,
                onClick = { expanded = true }
            )

            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                options.forEachIndexed { index, option ->
                    DropdownMenuItem(
                        text = { Text(option) },
                        onClick = {
                            onSelected(optionValues[index])
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun BookChoiceButton(
    text: String,
    icon: ImageVector,
    onClick: () -> Unit,
    enabled: Boolean = true
) {
    Button(
        enabled = enabled,
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp),
        shape = RoundedCornerShape(14.dp),
        contentPadding = PaddingValues(
            horizontal = 12.dp,
            vertical = 12.dp
        ),
        colors = ButtonDefaults.buttonColors(
            containerColor = BookFieldBackground,
            contentColor = Color.White
        )
    ) {
        Text(
            text = text,
            modifier = Modifier.weight(1f)
        )

        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp)
        )
    }
}
