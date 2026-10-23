package za.co.wrja.mobile

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog

/* Primary mobile render of the supplied website source. Existing Supabase
   services remain in the project for later live content administration. */

@Composable
private fun WebsiteImageCard(
    image: Int,
    description: String,
    modifier: Modifier = Modifier,
    imageHeight: Dp = 205.dp,
    imageContentScale: ContentScale = ContentScale.Crop,
    content: @Composable ColumnScope.() -> Unit
) {
    WrjaContentCard(modifier) {
        Box(Modifier.fillMaxWidth().height(imageHeight)) {
            Image(
                painter = painterResource(image),
                contentDescription = description,
                modifier = Modifier.fillMaxSize(),
                contentScale = imageContentScale,
                alignment = Alignment.TopCenter
            )
            Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0x9E000000)))))
        }
        Column(Modifier.padding(18.dp), content = content)
    }
}

@Composable fun WebsitePrograms() {
    val programs = listOf(
        Triple(R.drawable.kids_judo, "Kids Judo", "Structured, age-appropriate coaching in a safe, supportive environment. Learn balance, safe falling and basic technique while building discipline, respect and confidence."),
        Triple(R.drawable.adult_judo, "Adult Judo", "For complete beginners through to competitive judoka. Training includes standing technique (tachi-waza), groundwork (ne-waza) and competition-focused conditioning."),
        Triple(R.drawable.womens_judo, "Women’s Judo", "A dedicated, welcoming space to train, compete and grow. Build technical skill, fitness, confidence and self-defence skills in a supportive club community.")
    )
    WrjaSectionHeading("Find your place", "Programs built around your journey", "Choose a supportive pathway from your first lesson to competitive judo.")
    Spacer(Modifier.height(18.dp))
    programs.forEachIndexed { index, (image, title, description) ->
        WebsiteImageCard(image, title, Modifier.fillMaxWidth().padding(bottom = 18.dp).wrjaReveal(index)) {
            Text("WRJA PROGRAM", color = WrjaGold, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(6.dp))
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp)); Text(description, color = WrjaMuted)
        }
    }
}

@Composable fun WebsiteNews() {
    val stories = listOf(
        Triple(R.drawable.news_1, "4 August 2026", "National success for Golden Score judokas"),
        Triple(R.drawable.news_2, "24 July 2026", "4 KJK Judo athletes claim medals at African Cup"),
        Triple(R.drawable.news_3, "18 July 2026", "Golden Score judokas stand tall among Africa’s best"),
        Triple(R.drawable.news_4, "9 July 2026", "Suid-Afrikaanse Judokampioenskappe lok land se beste judokas na Gqeberha")
    )
    WrjaSectionHeading("From the mat", "Latest WRJA news", "Results, milestones and stories from our clubs and athletes.")
    Spacer(Modifier.height(18.dp))
    stories.forEachIndexed { index, (image, date, title) ->
        WebsiteImageCard(
            image,
            title,
            Modifier.fillMaxWidth().padding(bottom = 16.dp).wrjaReveal(index),
            190.dp,
            if (image == R.drawable.news_2 || image == R.drawable.news_3) ContentScale.Fit else ContentScale.Crop
        ) {
            Text("COMPETITION", color = WrjaGold, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(7.dp)); Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(9.dp)); Text(date, color = WrjaMuted, style = MaterialTheme.typography.labelMedium)
        }
    }
}

private data class WebsitePhoto(val category: String, val image: Int, val caption: String)
private data class WebsiteInstructor(val image: Int, val name: String, val role: String, val summary: String)
private data class WebsiteClubLink(val label: String, val address: String)
private data class WebsiteClub(val name: String, val summary: String, val links: List<WebsiteClubLink>)

private fun openPublicWebsite(context: Context, address: String) {
    context.startActivity(
        Intent(Intent.ACTION_VIEW, Uri.parse(address)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    )
}

@Composable fun WebsiteHome() {
    WebsiteImageCard(R.drawable.home_cover_1, "WRJA judoka", Modifier.fillMaxWidth().wrjaReveal(), 225.dp) {
        Text("WEST RAND JUDO ASSOCIATION", color = WrjaGold, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(7.dp)); Text("Your WRJA journey starts here.", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp)); Text("Explore competitions, experienced coaching and a supportive club community across the West Rand.", color = WrjaMuted)
    }
    Spacer(Modifier.height(14.dp))
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        HomeFeature(R.drawable.home_cover_2, "TRAIN WITH PURPOSE", "Coaching, discipline and growth.", Modifier.weight(1f).wrjaReveal(1))
        HomeFeature(R.drawable.home_cover_3, "GROW WITH YOUR CLUB", "From first class to the competition mat.", Modifier.weight(1f).wrjaReveal(2))
    }
    Spacer(Modifier.height(28.dp)); WrjaSectionHeading("What you can expect", "Train with confidence.", "A WRJA journey is built around support, structure and progress at every level.")
    Spacer(Modifier.height(16.dp))
    val benefits = listOf(
        "Convenient times" to "Weekday evening and weekend sessions that fit around school and work schedules.",
        "Grading pathway" to "A clear belt progression system with regular grading opportunities.",
        "Quality equipment" to "Well-maintained mats and gis available for training sessions.",
        "Guided nutrition" to "Basic nutrition guidance to support training and weight categories.",
        "Certified coaches" to "Instructors with national coaching certification and years of experience.",
        "Club champions" to "A strong record of provincial and national competition results."
    )
    benefits.chunked(2).forEachIndexed { rowIndex, row ->
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            row.forEachIndexed { columnIndex, (title, copy) ->
                HomeBenefit(title, copy, Modifier.weight(1f).wrjaReveal(rowIndex * 2 + columnIndex + 3))
            }
        }
        Spacer(Modifier.height(10.dp))
    }
    Spacer(Modifier.height(18.dp)); WrjaSectionHeading("What’s next", "Everything happening around the mat.", "View WRJA events, competition information, training pathways and club news from one place.")
}

@Composable private fun HomeFeature(image: Int, title: String, copy: String, modifier: Modifier) {
    WrjaContentCard(modifier) {
        Image(painterResource(image), title, Modifier.fillMaxWidth().height(122.dp).clip(MaterialTheme.shapes.medium), contentScale = ContentScale.Crop)
        Spacer(Modifier.height(12.dp)); Text(title, color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(5.dp)); Text(copy, style = MaterialTheme.typography.bodySmall, color = WrjaMuted)
    }
}

@Composable private fun HomeBenefit(title: String, copy: String, modifier: Modifier) {
    WrjaContentCard(modifier) {
        Column(Modifier.padding(14.dp)) {
            Text("WRJA", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(6.dp)); Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp)); Text(copy, color = WrjaMuted, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable fun WebsiteGallery() {
    var category by rememberSaveable { mutableStateOf("All") }
    var selectedPhotoIndex by rememberSaveable { mutableStateOf<Int?>(null) }
    val photos = listOf(
        WebsitePhoto("Adult Judo", R.drawable.gallery_adult_1, "Adult Judo training"), WebsitePhoto("Adult Judo", R.drawable.gallery_adult_2, "Adult Judo training session"),
        WebsitePhoto("Competitions", R.drawable.gallery_competition_1, "Judo competition"), WebsitePhoto("Competitions", R.drawable.gallery_competition_2, "Competition action"), WebsitePhoto("Competitions", R.drawable.gallery_competition_3, "Judo competition action"), WebsitePhoto("Competitions", R.drawable.gallery_competition_4, "WRJA competition"),
        WebsitePhoto("Kids Judo", R.drawable.gallery_kid_1, "Kids Judo training"), WebsitePhoto("Kids Judo", R.drawable.gallery_kid_2, "Junior Judo training"), WebsitePhoto("Kids Judo", R.drawable.gallery_kid_3, "Kids Judo session")
    )
    WrjaSectionHeading("On the mat", "WRJA gallery", "Moments from training, championships and the next generation of judoka.")
    Spacer(Modifier.height(16.dp))
    Row(
        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        listOf("All", "Kids Judo", "Adult Judo", "Competitions").forEach { item ->
            FilterChip(
                selected = category == item,
                onClick = { category = item; selectedPhotoIndex = null },
                label = { Text(item, maxLines = 1, style = MaterialTheme.typography.labelMedium) },
                colors = FilterChipDefaults.filterChipColors(containerColor = WrjaCard, labelColor = WrjaMuted, selectedContainerColor = WrjaGold, selectedLabelColor = Color(0xFF090909))
            )
        }
    }
    Spacer(Modifier.height(14.dp))
    val visiblePhotos = photos.filter { category == "All" || it.category == category }
    visiblePhotos.chunked(2).forEachIndexed { index, row ->
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            row.forEach { photo ->
                WrjaContentCard(
                    Modifier.weight(1f)
                        .wrjaReveal(index)
                        .clickable { selectedPhotoIndex = visiblePhotos.indexOf(photo) }
                ) {
                    Box(Modifier.fillMaxWidth().height(155.dp).clip(MaterialTheme.shapes.medium).background(Color(0xFF101010))) {
                        Image(
                            painterResource(photo.image),
                            photo.caption,
                            Modifier.fillMaxSize(),
                            contentScale = if (photo.image in setOf(R.drawable.gallery_competition_2, R.drawable.gallery_competition_3, R.drawable.gallery_kid_1, R.drawable.gallery_kid_3)) ContentScale.Fit else ContentScale.Crop,
                            alignment = Alignment.TopCenter
                        )
                    }
                    Text(photo.caption, Modifier.padding(top = 10.dp), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Medium)
                }
            }
            if (row.size == 1) Spacer(Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
    }
    selectedPhotoIndex?.let { photoIndex ->
        val photo = visiblePhotos.getOrNull(photoIndex)
        if (photo != null) {
            Dialog(onDismissRequest = { selectedPhotoIndex = null }) {
                WrjaContentCard(Modifier.fillMaxWidth()) {
                    Box(Modifier.fillMaxWidth().height(420.dp).background(Color(0xFF101010))) {
                        Image(
                            painter = painterResource(photo.image),
                            contentDescription = photo.caption,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Fit,
                            alignment = Alignment.Center
                        )
                    }
                    Column(Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                        Text(photo.caption, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(4.dp))
                        Text(photo.category, color = WrjaMuted, style = MaterialTheme.typography.bodySmall)
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            TextButton(onClick = { selectedPhotoIndex = (photoIndex - 1 + visiblePhotos.size) % visiblePhotos.size }) { Text("‹ Previous", color = WrjaGold) }
                            TextButton(onClick = { selectedPhotoIndex = null }) { Text("Close", color = WrjaGold) }
                            TextButton(onClick = { selectedPhotoIndex = (photoIndex + 1) % visiblePhotos.size }) { Text("Next ›", color = WrjaGold) }
                        }
                    }
                }
            }
        }
    }
}

@Composable fun WebsiteAbout() {
    val context = LocalContext.current.applicationContext
    WebsiteImageCard(R.drawable.wrja_committee, "WRJA committee", Modifier.fillMaxWidth().wrjaReveal(), 220.dp) {
        Text("ABOUT US", color = WrjaGold, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(7.dp)); Text("West Rand Judo Association", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp)); Text("Building character on and off the mat. WRJA is a close-knit community of athletes, parents and coaches united by respect for judo.", color = WrjaMuted)
    }
    Spacer(Modifier.height(22.dp)); WrjaSectionHeading("Our mission", "Building confident people through judo", "To develop confident, disciplined and respectful individuals through high-quality judo coaching, sportsmanship, inclusivity and opportunity on and off the mat.")
    Spacer(Modifier.height(24.dp)); WrjaSectionHeading("Our people", "Instructors & facilitators", "Experienced coaches and facilitators building a strong judo community across the West Rand.")
    val instructors = listOf(
        WebsiteInstructor(R.drawable.sensei_michelle, "Michelle Diamond", "Founder & Director — Golden Score Judo", "3rd Dan Black Belt, Sport Psychology graduate and founder of Golden Score Judo."),
        WebsiteInstructor(R.drawable.sensei_katja, "Katja Bruwer", "Full-Time Coach — KJK Judo Club", "7th Dan, IJF Level 2 Coach, AJU & IJF Kata Judge and coach across all age groups."),
        WebsiteInstructor(R.drawable.sensei_neil, "Niel Bruwer", "Part-Time Coach — KJK Judo Club", "1st Dan, Provincial C Referee, nutrition specialist and school/club coach."),
        WebsiteInstructor(R.drawable.sensei_reece, "Reece-Hunter Erasmus", "Full-Time Coach — KJK Judo Club", "3rd Dan, JSA Level 2 Coach and National C Referee specialising in beginners, Kumite and Kata."),
        WebsiteInstructor(R.drawable.sensei_shasha, "Shasa-Mercedez Erasmus", "Full-Time Coach — KJK Judo Club", "Provincial C Referee developing young judoka at school and club level."),
        WebsiteInstructor(R.drawable.sensei_shombo, "Okende Shombo Djibril", "Coach PJ", "Coach and mentor whose judo journey began in Kinshasa and continues in South Africa."),
        WebsiteInstructor(R.drawable.sensei_jean, "Jean Kotze", "Part-Time Assistant Coach — KJK Judo Club", "1st Dan, Safeguarding-accredited assistant coach and Local Technical Official."),
        WebsiteInstructor(R.drawable.sensei_carien, "Carien du Plessis", "Head of Fitness & Conditioning", "Sho Dan competitive judoka with 14 years of judo experience."),
        WebsiteInstructor(R.drawable.sensei_johan, "Johan Collins", "Coach — Golden Score Judo", "Coach with 15 years of judo experience, focused on judoka on and off the mat.")
    )
    instructors.forEachIndexed { index, instructor ->
        WebsiteImageCard(
            instructor.image,
            instructor.name,
            Modifier.fillMaxWidth().padding(top = 14.dp).wrjaReveal(index),
            290.dp,
            ContentScale.Fit
        ) {
            Text(instructor.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(5.dp)); Text(instructor.role.uppercase(), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(8.dp)); Text(instructor.summary, color = WrjaMuted)
        }
    }
    Spacer(Modifier.height(24.dp)); WrjaSectionHeading("Stay connected", "Our affiliated clubs", "Find us on social media!")
    val clubs = listOf(
        WebsiteClub(
            "Golden Score Judo",
            "Randfontein-based club and WRJA training community.",
            listOf(
                WebsiteClubLink("Search Golden Score Judo on Facebook", "https://www.facebook.com/search/top?q=Golden%20Score%20Judo"),
                WebsiteClubLink("Search Golden Score Judo on Instagram", "https://www.instagram.com/explore/search/keyword/?q=Golden%20Score%20Judo")
            )
        ),
        WebsiteClub(
            "KJK Judo Club",
            "West Rand and greater Johannesburg Judo club.",
            listOf(
                WebsiteClubLink("Visit the official KJK Judo website", "https://www.kjkjudo.co.za/"),
                WebsiteClubLink("Search KJK Judo on Facebook", "https://www.facebook.com/search/top?q=KJK%20Judo%20Club"),
                WebsiteClubLink("Search KJK Judo on Instagram", "https://www.instagram.com/")
            )
        ),
        WebsiteClub(
            "West Rand Judo Association",
            "Association updates, member clubs and South African Judo information.",
            listOf(
                WebsiteClubLink("Search WRJA on Facebook", "https://www.facebook.com/search/top?q=West%20Rand%20Judo%20Association"),
                WebsiteClubLink("Search WRJA on Instagram", "https://www.instagram.com/explore/search/keyword/?q=West%20Rand%20Judo%20Association"),
                WebsiteClubLink("Visit the official Judo South Africa website", "https://www.judosa.co.za/")
            )
        )
    )
    clubs.forEachIndexed { index, club ->
        WrjaContentCard(Modifier.fillMaxWidth().padding(top = 12.dp).wrjaReveal(index)) {
            Column(Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 16.dp)) {
                Text(club.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(4.dp)); Text(club.summary, color = WrjaMuted, style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(10.dp)); Text("FIND US ON SOCIAL MEDIA", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
                club.links.forEach { link ->
                    TextButton(
                        onClick = { openPublicWebsite(context, link.address) },
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(vertical = 4.dp)
                    ) {
                        Text("↗  ${link.label}", modifier = Modifier.fillMaxWidth(), color = WrjaGold, style = MaterialTheme.typography.bodySmall, textAlign = androidx.compose.ui.text.style.TextAlign.Start)
                    }
                }
            }
        }
    }
}

@Composable
fun WebsiteEventsHub(
    onStandardEventsClick: () -> Unit,
    onCalendarClick: () -> Unit,
    onCompetitionsClick: () -> Unit,
    onSchoolsClick: () -> Unit,
    onStoreClick: () -> Unit
) {
    data class EventHubItem(
        val number: String,
        val eyebrow: String,
        val title: String,
        val description: String,
        val action: String,
        val onClick: () -> Unit
    )

    val items = listOf(
        EventHubItem("01", "WRJA ACTIVITIES", "Standard events", "Browse upcoming gradings, training camps and other WRJA events.", "VIEW STANDARD EVENTS", onStandardEventsClick),
        EventHubItem("02", "DATES & FIXTURES", "Calendar", "View upcoming WRJA events, training milestones and important dates.", "OPEN CALENDAR", onCalendarClick),
        EventHubItem("03", "ON THE MAT", "Competitions", "Find registrations, payment requirements and information for every competition.", "EXPLORE COMPETITIONS", onCompetitionsClick),
        EventHubItem("04", "SCHOOL JUDO", "Schools", "Explore the SA Schools Novice and SA Schools Advanced pathways.", "VIEW SCHOOLS EVENTS", onSchoolsClick),
        EventHubItem("05", "WRJA KIT", "Store", "Order WRJA and JSA tracksuits and request official WRJA posters.", "VISIT STORE", onStoreClick)
    )

    WrjaSectionHeading(
        "Your WRJA event hub",
        "Everything happening around the mat.",
        "Explore the calendar, competitions, school pathways and official WRJA kit from one clear starting point."
    )
    Spacer(Modifier.height(18.dp))
    items.forEachIndexed { index, item ->
        Card(
            onClick = item.onClick,
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).wrjaReveal(index),
            colors = CardDefaults.cardColors(containerColor = WrjaCard),
            elevation = CardDefaults.cardElevation(defaultElevation = 7.dp, pressedElevation = 2.dp)
        ) {
            Column(Modifier.padding(18.dp)) {
                Row(verticalAlignment = Alignment.Top) {
                    Text(item.number, color = WrjaGold, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                    Spacer(Modifier.width(16.dp))
                    Column(Modifier.weight(1f)) {
                        Text(item.eyebrow, color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
                        Spacer(Modifier.height(3.dp))
                        Text(item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(5.dp))
                        Text(item.description, color = WrjaMuted, style = MaterialTheme.typography.bodySmall)
                    }
                }
                Spacer(Modifier.height(14.dp))
                Text("${item.action}  →", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable fun WebsiteContact() {
    val context = LocalContext.current.applicationContext
    WrjaSectionHeading("Get in touch", "Contact the WRJA team", "Use the form above to send a message, or find the club details below.")
    Spacer(Modifier.height(20.dp)); Text("CLUB CONTACTS", color = WrjaGold, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.ExtraBold)
    data class ClubContact(val title: String, val address: String, val details: String)
    listOf(
        ClubContact("Golden Score Judo Dojo", "26 Covent Road, Greenhills, Randfontein", "School classes and additional outside venues available\nOffice: 078 870 9131 • simone@goldenscore.co.za\nSensei Michelle: 083 312 4312 • judoinfo@goldenscore.co.za"),
        ClubContact("KJK Judo", "NGK Paardekraal, Krugersdorp", "Additional training venues and school classes available\nContact: 083 329 5923 • katjajudo@iburst.co.za"),
        ClubContact("West Rand Judo Association", "3 Octavia, 49 Otto Street, Krugersdorp North", "Office for NPC administration only — not a training venue")
    ).forEachIndexed { index, club ->
        WrjaContentCard(Modifier.fillMaxWidth().padding(top = 12.dp).wrjaReveal(index)) {
            Text(club.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(8.dp))
            Text(club.address, color = Color(0xFFF5F5F5), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(5.dp))
            Text(club.details, color = WrjaMuted)
            Spacer(Modifier.height(8.dp))
            TextButton(
                onClick = {
                    openPublicWebsite(
                        context,
                        "https://www.google.com/maps/search/?api=1&query=${Uri.encode(club.address)}"
                    )
                },
                contentPadding = PaddingValues(vertical = 2.dp)
            ) {
                Text("OPEN IN MAPS  ↗", color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}
