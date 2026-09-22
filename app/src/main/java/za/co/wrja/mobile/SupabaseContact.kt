package za.co.wrja.mobile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
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

        WebsiteContactLocations()

        Spacer(modifier = Modifier.height(16.dp))

        SupabaseClubs()
    }
}

@Composable
private fun WebsiteContactLocations() {
    listOf(
        Triple("Golden Score Judo Dojo", "104 Stegman St, Randgate, Randfontein", "School classes and additional outside venues available\nOffice: 078 870 9131 • simone@goldenscore.co.za\nSensei Michelle: 083 312 4312 • judoinfo@goldenscore.co.za"),
        Triple("KJK Judo", "NGK Paardekraal, Krugersdorp", "Additional training venues and school classes available\nContact: 083 329 5923 • katjajudo@iburst.co.za"),
        Triple("West Rand Judo Association", "3 Octavia, 49 Otto Street, Krugersdorp North", "Office for NPC administration only — not a training venue")
    ).forEach { (name, address, details) ->
        Card(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                Text("📍 $address")
                Spacer(modifier = Modifier.height(6.dp))
                Text(details)
            }
        }
    }
}
