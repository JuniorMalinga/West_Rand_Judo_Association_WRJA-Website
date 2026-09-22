package za.co.wrja.mobile

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/* Primary mobile render of the supplied website source. Existing Supabase
   services remain in the project for later live content administration. */
private val SiteGold = Color(0xFFC9A227)
private val SiteInk = Color(0xFF1A1A1A)
private val SiteMuted = Color(0xFF555555)

@Composable fun WebsitePrograms() {
    val programs = listOf(
        Triple(R.drawable.kids_judo, "Kids Judo", "Structured, age-appropriate coaching in a safe, supportive environment. Learn balance, safe falling and basic technique while building discipline, respect and confidence."),
        Triple(R.drawable.adult_judo, "Adult Judo", "For complete beginners through to competitive judoka. Training includes standing technique (tachi-waza), groundwork (ne-waza) and competition-focused conditioning."),
        Triple(R.drawable.womens_judo, "Women’s Judo", "A dedicated, welcoming space to train, compete and grow. Build technical skill, fitness, confidence and self-defence skills in a supportive club community.")
    )
    programs.forEach { (image, title, description) ->
        Card(Modifier.fillMaxWidth().padding(bottom = 20.dp)) { Column {
            Image(painterResource(image), title, Modifier.fillMaxWidth().height(205.dp), contentScale = ContentScale.Crop)
            Column(Modifier.padding(18.dp)) {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp)); Text(description, color = SiteMuted)
            }
        } }
    }
}

@Composable fun WebsiteNews() {
    val stories = listOf(
        Triple(R.drawable.news_1, "4 August 2026", "National success for Golden Score judokas"),
        Triple(R.drawable.news_2, "24 July 2026", "4 KJK Judo athletes claim medals at African Cup"),
        Triple(R.drawable.news_3, "18 July 2026", "Golden Score judokas stand tall among Africa’s best"),
        Triple(R.drawable.news_4, "9 July 2026", "Suid-Afrikaanse Judokampioenskappe lok land se beste judokas na Gqeberha")
    )
    stories.forEach { (image, date, title) ->
        Card(Modifier.fillMaxWidth().padding(bottom = 18.dp)) { Column {
            Image(painterResource(image), title, Modifier.fillMaxWidth().height(190.dp), contentScale = ContentScale.Crop)
            Column(Modifier.padding(16.dp)) {
                Text(date, color = SiteMuted, style = MaterialTheme.typography.labelMedium)
                Spacer(Modifier.height(5.dp)); Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(7.dp)); Text("COMPETITION", color = SiteGold, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            }
        } }
    }
}

private data class WebsitePhoto(val category: String, val image: Int, val caption: String)

@Composable fun WebsiteGallery() {
    var category by rememberSaveable { mutableStateOf("All") }
    val photos = listOf(
        WebsitePhoto("Adult Judo", R.drawable.gallery_adult_1, "Adult Judo training"), WebsitePhoto("Adult Judo", R.drawable.gallery_adult_2, "Adult Judo training session"),
        WebsitePhoto("Competitions", R.drawable.gallery_competition_1, "Judo competition"), WebsitePhoto("Competitions", R.drawable.gallery_competition_2, "Competition action"), WebsitePhoto("Competitions", R.drawable.gallery_competition_3, "Judo competition action"), WebsitePhoto("Competitions", R.drawable.gallery_competition_4, "WRJA competition"),
        WebsitePhoto("Kids Judo", R.drawable.gallery_kid_1, "Kids Judo training"), WebsitePhoto("Kids Judo", R.drawable.gallery_kid_2, "Junior Judo training"), WebsitePhoto("Kids Judo", R.drawable.gallery_kid_3, "Kids Judo session")
    )
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        listOf("All", "Kids Judo", "Adult Judo", "Competitions").forEach { item ->
            FilterChip(selected = category == item, onClick = { category = item }, label = { Text(item, maxLines = 1) }, modifier = Modifier.weight(1f))
        }
    }
    Spacer(Modifier.height(14.dp))
    photos.filter { category == "All" || it.category == category }.chunked(2).forEach { row ->
        Row(Modifier.fillMaxWidth()) { row.forEach { photo ->
            Card(Modifier.weight(1f).padding(4.dp)) { Column {
                Image(painterResource(photo.image), photo.caption, Modifier.fillMaxWidth().height(155.dp), contentScale = ContentScale.Crop)
                Text(photo.caption, Modifier.padding(8.dp), style = MaterialTheme.typography.labelMedium)
            } }
        }; if (row.size == 1) Spacer(Modifier.weight(1f)) }
    }
}

@Composable fun WebsiteAbout() {
    Text("ABOUT WEST RAND JUDO ASSOCIATION", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(8.dp)); Text("Building character on and off the mat. WRJA is a close-knit community of athletes, parents and coaches united by respect for judo.", color = SiteMuted)
    Spacer(Modifier.height(20.dp)); Text("OUR INSTRUCTORS & FACILITATORS", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    listOf(
        Triple(R.drawable.sensei_katja, "Sensei Katja Bruwer", "Director — KJK Judo Club • 7th Dan, former SA National Team captain and IJF-qualified coach."),
        Triple(R.drawable.sensei_michelle, "Sensei Michelle Diamond", "Founder & Director — Golden Score Judo • 3rd Dan Black Belt and Sport Psychology graduate.")
    ).forEach { (image, name, detail) ->
        Card(Modifier.fillMaxWidth().padding(top = 14.dp)) { Column {
            Image(painterResource(image), name, Modifier.fillMaxWidth().height(250.dp).padding(8.dp), contentScale = ContentScale.Fit)
            Column(Modifier.padding(16.dp)) { Text(name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); Spacer(Modifier.height(6.dp)); Text(detail, color = SiteMuted) }
        } }
    }
    Spacer(Modifier.height(22.dp)); Text("FOLLOW OUR CLUBS", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    listOf("Golden Score Judo" to "Website • Facebook • Instagram", "KJK Judo Club" to "Website • Facebook • Instagram", "West Rand Judo Association" to "Facebook").forEach { (club, links) ->
        Card(Modifier.fillMaxWidth().padding(top = 10.dp)) { Column(Modifier.padding(16.dp)) { Text(club, fontWeight = FontWeight.Bold); Text(links, color = SiteGold) } }
    }
}

@Composable fun WebsiteContact() {
    Text("CONTACT FORM", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(8.dp)); Text("Use the Contact form to send the WRJA team a message.", color = SiteMuted)
    Spacer(Modifier.height(20.dp)); Text("CONTACT INFO", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    listOf(
        "Golden Score Judo Dojo" to "104 Stegman St, Randgate, Randfontein\nSchool classes and additional outside venues available\nOffice: 078 870 9131 • simone@goldenscore.co.za\nSensei Michelle: 083 312 4312 • judoinfo@goldenscore.co.za",
        "KJK Judo" to "NGK Paardekraal, Krugersdorp\nAdditional training venues and school classes available\nContact: 083 329 5923 • katjajudo@iburst.co.za",
        "West Rand Judo Association" to "3 Octavia, 49 Otto Street, Krugersdorp North\nOffice for NPC administration only — not a training venue"
    ).forEach { (title, details) -> Card(Modifier.fillMaxWidth().padding(top = 12.dp)) { Column(Modifier.padding(16.dp)) { Text(title, fontWeight = FontWeight.Bold); Spacer(Modifier.height(6.dp)); Text(details, color = SiteMuted) } } }
}
