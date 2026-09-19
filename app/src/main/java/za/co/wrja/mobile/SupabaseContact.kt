package za.co.wrja.mobile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun SupabaseContact() {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "CONTACT OUR CLUBS",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Contact your nearest club for training times, " +
                    "membership enquiries, and more information."
        )

        Spacer(modifier = Modifier.height(16.dp))

        SupabaseClubs()
    }
}