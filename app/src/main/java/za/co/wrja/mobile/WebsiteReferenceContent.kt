package za.co.wrja.mobile

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
private val SiteGold = Color(0xFFF1BD16)
private val SiteMuted = Color(0xFFA6A6A6)

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
private data class WebsiteInstructor(
    val image: Int,
    val name: String,
    val role: String,
    val summary: String
)

@Composable fun WebsiteHome() {
    Card(Modifier.fillMaxWidth().padding(bottom = 20.dp)) {
        Column {
            Image(painterResource(R.drawable.home_cover_1), "WRJA judoka", Modifier.fillMaxWidth().height(210.dp), contentScale = ContentScale.Crop)
            Column(Modifier.padding(18.dp)) {
                Text("STEP ONTO THE COMPETITION MAT.", color = SiteGold, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Text("Your WRJA journey starts here.", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(7.dp)); Text("Explore competitions, experienced coaching and a supportive club community across the West Rand.", color = SiteMuted)
            }
        }
    }
    Row(Modifier.fillMaxWidth()) {
        HomeFeature(R.drawable.home_cover_2, "TRAIN WITH PURPOSE", "Coaching, discipline and growth.", Modifier.weight(1f))
        HomeFeature(R.drawable.home_cover_3, "GROW WITH YOUR CLUB", "From first class to the competition mat.", Modifier.weight(1f))
    }
    Spacer(Modifier.height(20.dp))
    Text("WHAT'S NEXT", color = SiteGold, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(6.dp)); Text("Everything happening around the mat.", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(8.dp)); Text("View WRJA events, competition information, training pathways and club news from one place.", color = SiteMuted)
}

@Composable private fun HomeFeature(image: Int, title: String, copy: String, modifier: Modifier) {
    Card(modifier.padding(4.dp)) { Column {
        Image(painterResource(image), title, Modifier.fillMaxWidth().height(122.dp), contentScale = ContentScale.Crop)
        Column(Modifier.padding(12.dp)) { Text(title, color = SiteGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold); Spacer(Modifier.height(5.dp)); Text(copy, style = MaterialTheme.typography.bodySmall, color = SiteMuted) }
    } }
}

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
    Card(Modifier.fillMaxWidth()) { Column {
        Image(painterResource(R.drawable.wrja_committee), "WRJA committee", Modifier.fillMaxWidth().height(210.dp), contentScale = ContentScale.Crop)
        Column(Modifier.padding(18.dp)) {
            Text("ABOUT WEST RAND JUDO ASSOCIATION", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp)); Text("Building character on and off the mat. WRJA is a close-knit community of athletes, parents and coaches united by respect for judo.", color = SiteMuted)
        }
    } }
    Spacer(Modifier.height(22.dp)); Text("OUR MISSION", color = SiteGold, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(8.dp)); Text("To develop confident, disciplined and respectful individuals through high-quality judo coaching, sportsmanship, inclusivity and opportunity on and off the mat.", color = SiteMuted)
    Spacer(Modifier.height(20.dp)); Text("OUR INSTRUCTORS & FACILITATORS", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(6.dp)); Text("Experienced coaches and facilitators building a strong judo community across the West Rand.", color = SiteMuted)
    listOf(
        WebsiteInstructor(R.drawable.sensei_michelle, "Michelle Diamond", "Founder & Director — Golden Score Judo", "3rd Dan Black Belt, Sport Psychology graduate and founder of Golden Score Judo."),
        WebsiteInstructor(R.drawable.sensei_katja, "Katja Bruwer", "Full-Time Coach — KJK Judo Club", "7th Dan, IJF Level 2 Coach, AJU & IJF Kata Judge and coach across all age groups."),
        WebsiteInstructor(R.drawable.sensei_neil, "Niel Bruwer", "Part-Time Coach — KJK Judo Club", "1st Dan, Provincial C Referee, nutrition specialist and school/club coach."),
        WebsiteInstructor(R.drawable.sensei_reece, "Reece-Hunter Erasmus", "Full-Time Coach — KJK Judo Club", "3rd Dan, JSA Level 2 Coach and National C Referee specialising in beginners, Kumite and Kata."),
        WebsiteInstructor(R.drawable.sensei_shasha, "Shasa-Mercedez Erasmus", "Full-Time Coach — KJK Judo Club", "Provincial C Referee developing young judoka at school and club level."),
        WebsiteInstructor(R.drawable.sensei_shombo, "Okende Shombo Djibril", "Coach PJ", "Coach and mentor whose judo journey began in Kinshasa and continues in South Africa."),
        WebsiteInstructor(R.drawable.sensei_jean, "Jean Kotze", "Part-Time Assistant Coach — KJK Judo Club", "1st Dan, Safeguarding-accredited assistant coach and Local Technical Official."),
        WebsiteInstructor(R.drawable.sensei_carien, "Carien du Plessis", "Head of Fitness & Conditioning", "Sho Dan competitive judoka with 14 years of judo experience."),
        WebsiteInstructor(R.drawable.sensei_johan, "Johan Collins", "Coach — Golden Score Judo", "Coach with 15 years of judo experience, focused on judoka on and off the mat.")
    ).forEach { instructor ->
        Card(Modifier.fillMaxWidth().padding(top = 14.dp)) { Column {
            Image(painterResource(instructor.image), instructor.name, Modifier.fillMaxWidth().height(250.dp).padding(8.dp), contentScale = ContentScale.Fit)
            Column(Modifier.padding(16.dp)) { Text(instructor.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); Spacer(Modifier.height(4.dp)); Text(instructor.role.uppercase(), color = SiteGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold); Spacer(Modifier.height(6.dp)); Text(instructor.summary, color = SiteMuted) }
        } }
    }
    Spacer(Modifier.height(22.dp)); Text("FOLLOW OUR CLUBS", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    listOf("Golden Score Judo", "KJK Judo Club", "West Rand Judo Association").forEach { club ->
        Card(Modifier.fillMaxWidth().padding(top = 10.dp)) { Column(Modifier.padding(16.dp)) { Text(club, fontWeight = FontWeight.Bold); Text("Find us on social media!", color = SiteGold) } }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun WebsiteEventsHub(onCompetitionsClick: () -> Unit) {
    Text("YOUR WRJA EVENT HUB", color = SiteGold, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(7.dp)); Text("Everything happening around the mat.", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(8.dp)); Text("Explore the calendar, competitions, school pathways and official WRJA kit from one clear starting point.", color = SiteMuted)
    Spacer(Modifier.height(18.dp))
    listOf(
        Triple("01", "Calendar", "View upcoming WRJA events, training milestones and important dates."),
        Triple("02", "Competitions", "Find registrations, payment requirements and information for every competition."),
        Triple("03", "Schools", "Explore SA Schools Novice and SA Schools Advanced pathways."),
        Triple("04", "Store", "Order WRJA and JSA tracksuits and request official WRJA posters.")
    ).forEach { (number, title, description) ->
        val cardModifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
        val cardContent: @Composable ColumnScope.() -> Unit = {
            Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(number, color = SiteGold, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(16.dp))
                Column {
                    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Text(description, color = SiteMuted, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        if (title == "Competitions") {
            Card(
                onClick = onCompetitionsClick,
                modifier = cardModifier,
                content = cardContent
            )
        } else {
            Card(modifier = cardModifier, content = cardContent)
        }
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
