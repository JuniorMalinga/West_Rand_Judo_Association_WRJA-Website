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

private val BookGold = Color(0xFFC9A227)
private val BookFieldBackground = Color(0xFF3B3B3B)

@Composable
fun BookScreen() {
    val context = LocalContext.current

    var program by rememberSaveable { mutableStateOf("") }
    var fullName by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var paymentMethod by rememberSaveable { mutableStateOf("") }
    var dateMillis by rememberSaveable { mutableStateOf<Long?>(null) }
    var hour by rememberSaveable { mutableStateOf(-1) }
    var minute by rememberSaveable { mutableStateOf(0) }
    var notes by rememberSaveable { mutableStateOf("") }

    var error by remember { mutableStateOf<String?>(null) }
    var previewComplete by remember { mutableStateOf(false) }

    val dateText = dateMillis?.let {
        SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(Date(it))
    }.orEmpty()

    val timeText = if (hour >= 0) {
        String.format(Locale.ROOT, "%02d:%02d", hour, minute)
    } else {
        ""
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(6.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF656565)
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = "Request a booking",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "Choose a program and enter your preferred session details.",
                color = Color.LightGray,
                fontSize = 13.sp
            )

            BookDropdown(
                label = "Program",
                value = program,
                placeholder = "Select a program",
                options = listOf(
                    "Kids Judo",
                    "Adult Judo",
                    "Woman's Judo"
                ),
                onSelected = { program = it }
            )

            BookInput(
                label = "Full name",
                value = fullName,
                placeholder = "Your full name",
                onValueChange = { fullName = it }
            )

            BookInput(
                label = "Email address",
                value = email,
                placeholder = "you@example.com",
                keyboardType = KeyboardType.Email,
                onValueChange = { email = it }
            )

            BookInput(
                label = "Phone number",
                value = phone,
                placeholder = "Your phone number",
                keyboardType = KeyboardType.Phone,
                onValueChange = { phone = it }
            )

            BookDropdown(
                label = "Payment method",
                value = paymentMethod,
                placeholder = "Select a payment method",
                options = listOf("EFT", "Cash", "Card"),
                onSelected = { paymentMethod = it }
            )

            Column {
                BookLabel("Preferred date")

                BookChoiceButton(
                    text = dateText.ifBlank { "Select a date" },
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
                BookLabel("Preferred time")

                BookChoiceButton(
                    text = timeText.ifBlank { "Select a time" },
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
                label = "Notes (optional)",
                value = notes,
                placeholder = "Anything we should know before your session",
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

            Button(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(4.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BookGold,
                    contentColor = Color.Black
                ),
                onClick = {
                    previewComplete = false

                    error = when {
                        program.isBlank() ->
                            "Please select a program."

                        fullName.isBlank() ->
                            "Please enter your full name."

                        !Patterns.EMAIL_ADDRESS
                            .matcher(email.trim())
                            .matches() ->
                            "Please enter a valid email address."

                        phone.isBlank() ->
                            "Please enter your phone number."

                        paymentMethod.isBlank() ->
                            "Please select a payment method."

                        dateMillis == null ->
                            "Please select a preferred date."

                        hour < 0 ->
                            "Please select a preferred time."

                        else -> null
                    }

                    if (error == null) {
                        previewComplete = true
                    }
                }
            ) {
                Text(
                    "REQUEST BOOKING",
                    fontWeight = FontWeight.Bold
                )
            }

            if (previewComplete) {
                Text(
                    text = "Form completed. This is a preview; " +
                            "no booking has been sent.",
                    color = Color.White,
                    fontSize = 13.sp
                )
            }
        }
    }
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
    multiline: Boolean = false
) {
    Column {
        BookLabel(label)

        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = !multiline,
            minLines = if (multiline) 3 else 1,
            shape = RoundedCornerShape(4.dp),
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
    onSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Column {
        BookLabel(label)

        Box(Modifier.fillMaxWidth()) {
            BookChoiceButton(
                text = value.ifBlank { placeholder },
                icon = Icons.Default.ArrowDropDown,
                onClick = { expanded = true }
            )

            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option) },
                        onClick = {
                            onSelected(option)
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
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp),
        shape = RoundedCornerShape(4.dp),
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