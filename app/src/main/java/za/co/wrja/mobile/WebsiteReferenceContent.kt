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
import androidx.compose.runtime.LaunchedEffect
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
        Triple(R.drawable.kids_judo, localized("Kids Judo", "Kinderjudo", "I-Judo Yezingane"), localized("Structured, age-appropriate coaching in a safe, supportive environment. Learn balance, safe falling and basic technique while building discipline, respect and confidence.", "Gestruktureerde, ouderdomstoepaslike afrigting in 'n veilige, ondersteunende omgewing. Leer balans, veilige val en basiese tegniek terwyl dissipline, respek en selfvertroue groei.", "Ukuqeqeshwa okuhlelwe ngokweminyaka endaweni ephephile nesekelayo. Funda ukulinganisela, ukuwa ngokuphepha namasu ayisisekelo ngenkathi wakha isimilo, inhlonipho nokuzethemba.")),
        Triple(R.drawable.adult_judo, localized("Adult Judo", "Volwasse Judo", "I-Judo Yabantu Abadala"), localized("For complete beginners through to competitive judoka. Training includes standing technique, groundwork and competition-focused conditioning.", "Vir volledige beginners tot mededingende judoka. Opleiding sluit staande tegniek, grondwerk en kompetisiegerigte kondisionering in.", "Kwabaqalayo ngokuphelele kuya kuma-judoka ancintisanayo. Ukuqeqeshwa kufaka amasu okuma, umsebenzi waphansi nokulungiselela imincintiswano.")),
        Triple(R.drawable.womens_judo, localized("Women’s Judo", "Vrouejudo", "I-Judo Yabesifazane"), localized("A dedicated, welcoming space to train, compete and grow. Build technical skill, fitness, confidence and self-defence skills in a supportive club community.", "'n Toegewyde, verwelkomende ruimte om te oefen, mee te ding en te groei. Bou tegniese vaardigheid, fiksheid, selfvertroue en selfverdedigingsvaardighede in 'n ondersteunende klubgemeenskap.", "Indawo ezinikele, eyamukelayo yokuqeqesha, ukuncintisana nokukhula. Yakha ikhono lobuchwepheshe, ukuqina, ukuzethemba namakhono okuzivikela emphakathini weklabhu osekelayo."))
    )
    WrjaSectionHeading(localized("Find your place", "Vind jou plek", "Thola indawo yakho"), localized("Programs built around your journey", "Programme gebou rondom jou reis", "Izinhlelo ezakhelwe uhambo lwakho"), localized("Choose a supportive pathway from your first lesson to competitive judo.", "Kies 'n ondersteunende roete vanaf jou eerste les tot mededingende judo.", "Khetha indlela esekelayo kusukela esifundweni sakho sokuqala kuya ku-judo yokuncintisana."))
    Spacer(Modifier.height(18.dp))
    programs.forEachIndexed { index, (image, title, description) ->
        WebsiteImageCard(image, title, Modifier.fillMaxWidth().padding(bottom = 18.dp).wrjaReveal(index)) {
            Text(localized("WRJA PROGRAM", "WRJA-PROGRAM", "UHLELO LWE-WRJA"), color = WrjaGold, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(6.dp))
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp)); Text(description, color = WrjaMuted)
        }
    }
}

@Composable fun WebsiteNews() {
    val stories = listOf(
        Triple(R.drawable.news_1, "4 August 2026", localized("National success for Golden Score judokas", "Nasionale sukses vir Golden Score-judokas", "Impumelelo kazwelonke yama-judoka e-Golden Score")),
        Triple(R.drawable.news_2, "24 July 2026", localized("4 KJK Judo athletes claim medals at African Cup", "4 KJK Judo-atlete wen medaljes by African Cup", "Abasubathi abangu-4 be-KJK Judo bawina izindondo ku-African Cup")),
        Triple(R.drawable.news_3, "18 July 2026", localized("Golden Score judokas stand tall among Africa’s best", "Golden Score-judokas staan sterk onder Afrika se bestes", "Ama-judoka e-Golden Score ame phakathi kwabahamba phambili e-Afrika")),
        Triple(R.drawable.news_4, "9 July 2026", "Suid-Afrikaanse Judokampioenskappe lok land se beste judokas na Gqeberha")
    )
    WrjaSectionHeading(localized("From the mat", "Van die mat", "Kusuka kumata"), localized("Latest WRJA news", "Nuutste WRJA-nuus", "Izindaba zakamuva ze-WRJA"), localized("Results, milestones and stories from our clubs and athletes.", "Uitslae, mylpale en stories van ons klubs en atlete.", "Imiphumela, amagalelo nezindaba ezivela kumaklabhu nabasubathi bethu."))
    Spacer(Modifier.height(18.dp))
    stories.forEachIndexed { index, (image, date, title) ->
        WebsiteImageCard(
            image,
            title,
            Modifier.fillMaxWidth().padding(bottom = 16.dp).wrjaReveal(index),
            190.dp,
            if (image == R.drawable.news_2 || image == R.drawable.news_3) ContentScale.Fit else ContentScale.Crop
        ) {
            Text(localized("COMPETITION", "KOMPETISIE", "UMNCINTISWANO"), color = WrjaGold, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.ExtraBold)
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
        Spacer(Modifier.height(7.dp)); Text(localized("Your WRJA journey starts here.", "Jou WRJA-reis begin hier.", "Uhambo lwakho lwe-WRJA luqala lapha."), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp)); Text(localized("Explore competitions, experienced coaching and a supportive club community across the West Rand.", "Verken kompetisies, ervare afrigting en 'n ondersteunende klubgemeenskap oor die Wes-Rand.", "Hlola imincintiswano, ukuqeqeshwa okunolwazi nomphakathi weklabhu osekelayo e-West Rand."), color = WrjaMuted)
    }
    Spacer(Modifier.height(14.dp))
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        HomeFeature(R.drawable.home_cover_2, localized("TRAIN WITH PURPOSE", "OEFEN MET DOEL", "QEQESHA NGENGQONDO"), localized("Coaching, discipline and growth.", "Afrigting, dissipline en groei.", "Ukuqeqeshwa, isimilo nokukhula."), Modifier.weight(1f).wrjaReveal(1))
        HomeFeature(R.drawable.home_cover_3, localized("GROW WITH YOUR CLUB", "GROEI SAAM MET JOU KLUB", "KHULA NEKLABHU YAKHO"), localized("From first class to the competition mat.", "Van eerste klas tot die kompetisiemat.", "Kusukela ekilasini lokuqala kuya kumata womncintiswano."), Modifier.weight(1f).wrjaReveal(2))
    }
    Spacer(Modifier.height(28.dp)); WrjaSectionHeading(localized("What you can expect", "Wat jy kan verwag", "Ongakulindela"), localized("Train with confidence.", "Oefen met selfvertroue.", "Qeqesha ngokuzethemba."), localized("A WRJA journey is built around support, structure and progress at every level.", "'n WRJA-reis is gebou op ondersteuning, struktuur en vordering op elke vlak.", "Uhambo lwe-WRJA lwakhiwe ukwesekwa, ukuhleleka nenqubekela phambili kuwo wonke amazinga."))
    Spacer(Modifier.height(16.dp))
    val benefits = listOf(
        localized("Convenient times", "Gerieflike tye", "Izikhathi ezilungele") to localized("Weekday evening and weekend sessions that fit around school and work schedules.", "Weeksnagaand- en naweeksessies wat by skool- en werkskedules pas.", "Amaseshini asebusuku phakathi neviki nawangezimpelasonto ahambisana nezinhlelo zesikole nomsebenzi."),
        localized("Grading pathway", "Graderingsroete", "Indlela yokukleliswa") to localized("A clear belt progression system with regular grading opportunities.", "'n Duidelike gordelvorderingstelsel met gereelde graderingsgeleenthede.", "Uhlelo olucacile lokuqhubeka kwamabhande olunamathuba avamile okukleliswa."),
        localized("Quality equipment", "Gehalte-toerusting", "Imishini esezingeni") to localized("Well-maintained mats and gis available for training sessions.", "Goed onderhoude matte en gi's beskikbaar vir oefensessies.", "Omata nama-gi anakekelwe kahle ayatholakala eziseshini zokuqeqesha."),
        localized("Guided nutrition", "Voedingsleiding", "Ukuholwa kokudla") to localized("Basic nutrition guidance to support training and weight categories.", "Basiese voedingsleiding om opleiding en gewigskategorieë te ondersteun.", "Ukuholwa okuyisisekelo kokudla ukusekela ukuqeqeshwa nezigaba zesisindo."),
        localized("Certified coaches", "Gesertifiseerde afrigters", "Abaqeqeshi abaqinisekisiwe") to localized("Instructors with national coaching certification and years of experience.", "Instrukteurs met nasionale afrigtingsertifisering en jare se ervaring.", "Abaqeqeshi abanezitifiketi zikazwelonke neminyaka yesipiliyoni."),
        localized("Club champions", "Klubkampioene", "Ompetha beklabhu") to localized("A strong record of provincial and national competition results.", "'n Sterk rekord van provinsiale en nasionale kompetisie-uitslae.", "Irekhodi eliqinile lemiphumela yemincintiswano yesifundazwe nekazwelonke.")
    )
    benefits.chunked(2).forEachIndexed { rowIndex, row ->
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            row.forEachIndexed { columnIndex, (title, copy) ->
                HomeBenefit(title, copy, Modifier.weight(1f).wrjaReveal(rowIndex * 2 + columnIndex + 3))
            }
        }
        Spacer(Modifier.height(10.dp))
    }
    Spacer(Modifier.height(18.dp)); WrjaSectionHeading(localized("What’s next", "Wat is volgende", "Yini elandelayo"), localized("Everything happening around the mat.", "Alles wat rondom die mat gebeur.", "Konke okwenzeka eduze komata."), localized("View WRJA events, competition information, training pathways and club news from one place.", "Sien WRJA-geleenthede, kompetisie-inligting, oefenroetes en klubnuus op een plek.", "Bona imicimbi ye-WRJA, ulwazi lwemincintiswano, izindlela zokuqeqesha nezindaba zeklabhu endaweni eyodwa."))
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
    val allLabel = localized("All", "Alles", "Konke")
    LaunchedEffect(allLabel) {
        category = allLabel
        selectedPhotoIndex = null
    }
    val photos = listOf(
        WebsitePhoto(localized("Adult Judo", "Volwasse Judo", "I-Judo Yabantu Abadala"), R.drawable.gallery_adult_1, localized("Adult Judo training", "Volwasse judo-opleiding", "Ukuqeqeshwa kwe-judo yabantu abadala")), WebsitePhoto(localized("Adult Judo", "Volwasse Judo", "I-Judo Yabantu Abadala"), R.drawable.gallery_adult_2, localized("Adult Judo training session", "Volwasse judo-oefensessie", "Iseshini yokuqeqesha ye-judo yabantu abadala")),
        WebsitePhoto(localized("Competitions", "Kompetisies", "Imiqhudelwano"), R.drawable.gallery_competition_1, localized("Judo competition", "Judo-kompetisie", "Umncintiswano we-judo")), WebsitePhoto(localized("Competitions", "Kompetisies", "Imiqhudelwano"), R.drawable.gallery_competition_2, localized("Competition action", "Kompetisie-aksie", "Isenzo somncintiswano")), WebsitePhoto(localized("Competitions", "Kompetisies", "Imiqhudelwano"), R.drawable.gallery_competition_3, localized("Judo competition action", "Judo-kompetisie-aksie", "Isenzo somncintiswano we-judo")), WebsitePhoto(localized("Competitions", "Kompetisies", "Imiqhudelwano"), R.drawable.gallery_competition_4, localized("WRJA competition", "WRJA-kompetisie", "Umncintiswano we-WRJA")),
        WebsitePhoto(localized("Kids Judo", "Kinderjudo", "I-Judo Yezingane"), R.drawable.gallery_kid_1, localized("Kids Judo training", "Kinderjudo-opleiding", "Ukuqeqeshwa kwe-judo yezingane")), WebsitePhoto(localized("Kids Judo", "Kinderjudo", "I-Judo Yezingane"), R.drawable.gallery_kid_2, localized("Junior Judo training", "Junior judo-opleiding", "Ukuqeqeshwa kwe-judo yabasha")), WebsitePhoto(localized("Kids Judo", "Kinderjudo", "I-Judo Yezingane"), R.drawable.gallery_kid_3, localized("Kids Judo session", "Kinderjudo-sessie", "Iseshini ye-judo yezingane"))
    )
    WrjaSectionHeading(localized("On the mat", "Op die mat", "Emateni"), localized("WRJA gallery", "WRJA-galery", "Igalari ye-WRJA"), localized("Moments from training, championships and the next generation of judoka.", "Oomblikke van opleiding, kampioenskappe en die volgende geslag judoka.", "Izikhathi zokuqeqeshwa, imiqhudelwano nesizukulwane esilandelayo sama-judoka."))
    Spacer(Modifier.height(16.dp))
    Row(
        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        listOf(allLabel, localized("Kids Judo", "Kinderjudo", "I-Judo Yezingane"), localized("Adult Judo", "Volwasse Judo", "I-Judo Yabantu Abadala"), localized("Competitions", "Kompetisies", "Imiqhudelwano")).forEach { label ->
            FilterChip(
                selected = category == label,
                onClick = { category = label; selectedPhotoIndex = null },
                label = { Text(label, maxLines = 1, style = MaterialTheme.typography.labelMedium) },
                colors = FilterChipDefaults.filterChipColors(containerColor = WrjaCard, labelColor = WrjaMuted, selectedContainerColor = WrjaGold, selectedLabelColor = Color(0xFF090909))
            )
        }
    }
    Spacer(Modifier.height(14.dp))
    val visiblePhotos = photos.filter { category == allLabel || it.category == category }
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
                            TextButton(onClick = { selectedPhotoIndex = (photoIndex - 1 + visiblePhotos.size) % visiblePhotos.size }) { Text(localized("‹ Previous", "‹ Vorige", "‹ Okwedlule"), color = WrjaGold) }
                            TextButton(onClick = { selectedPhotoIndex = null }) { Text(localized("Close", "Sluit", "Vala"), color = WrjaGold) }
                            TextButton(onClick = { selectedPhotoIndex = (photoIndex + 1) % visiblePhotos.size }) { Text(localized("Next ›", "Volgende ›", "Okulandelayo ›"), color = WrjaGold) }
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
        Text(localized("ABOUT US", "OOR ONS", "MAYELANA NATHI"), color = WrjaGold, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(7.dp)); Text("West Rand Judo Association", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp)); Text(localized("Building character on and off the mat. WRJA is a close-knit community of athletes, parents and coaches united by respect for judo.", "Bou karakter op en van die mat af. WRJA is 'n hegte gemeenskap van atlete, ouers en afrigters wat deur respek vir judo verenig word.", "Sakha isimilo ngaphakathi nangaphandle komata. I-WRJA umphakathi osondelene wabasubathi, abazali nabaqeqeshi abahlanganiswe yinhlonipho ye-judo."), color = WrjaMuted)
    }
    Spacer(Modifier.height(22.dp)); WrjaSectionHeading(localized("Our mission", "Ons missie", "Umgomo wethu"), localized("Building confident people through judo", "Bou selfversekerde mense deur judo", "Sakha abantu abazethembayo nge-judo"), localized("To develop confident, disciplined and respectful individuals through high-quality judo coaching, sportsmanship, inclusivity and opportunity on and off the mat.", "Om selfversekerde, gedissiplineerde en respekvolle mense te ontwikkel deur judo-afrigting van hoë gehalte, sportmanskap, inklusiwiteit en geleenthede op en van die mat af.", "Ukuthuthukisa abantu abazethembayo, abanesimilo nabahloniphekile ngokuqeqeshwa kwe-judo esezingeni, ubungcweti bezemidlalo, ukubandakanywa namathuba ngaphakathi nangaphandle komata."))
    Spacer(Modifier.height(24.dp)); WrjaSectionHeading(localized("Our people", "Ons mense", "Abantu bethu"), localized("Instructors & facilitators", "Instrukteurs en fasiliteerders", "Abaqeqeshi nabagqugquzeli"), localized("Experienced coaches and facilitators building a strong judo community across the West Rand.", "Ervare afrigters en fasiliteerders wat 'n sterk judo-gemeenskap oor die Wes-Rand bou.", "Abaqeqeshi nabagqugquzeli abanolwazi abakha umphakathi oqinile we-judo e-West Rand."))
    val instructors = listOf(
        WebsiteInstructor(R.drawable.sensei_michelle, "Michelle Diamond", localized("Founder & Director — Golden Score Judo", "Stigter en Direkteur — Golden Score Judo", "Umsunguli noMqondisi — Golden Score Judo"), localized("3rd Dan Black Belt, Sport Psychology graduate and founder of Golden Score Judo.", "3de Dan Swartgordel, Sportpsigologie-gegradueerde en stigter van Golden Score Judo.", "Ibhande Elimnyama le-3rd Dan, ofundele i-Sport Psychology nomsunguli we-Golden Score Judo.")),
        WebsiteInstructor(R.drawable.sensei_katja, "Katja Bruwer", localized("Full-Time Coach — KJK Judo Club", "Voltydse Afrigter — KJK Judo Club", "Umqeqeshi Wesikhathi Esigcwele — KJK Judo Club"), localized("7th Dan, IJF Level 2 Coach, AJU & IJF Kata Judge and coach across all age groups.", "7de Dan, IJF Vlak 2-afrigter, AJU- en IJF Kata-beoordelaar en afrigter vir alle ouderdomsgroepe.", "I-7th Dan, umqeqeshi we-IJF Level 2, ijaji le-AJU ne-IJF Kata nomqeqeshi wawo wonke amaqembu eminyaka.")),
        WebsiteInstructor(R.drawable.sensei_neil, "Niel Bruwer", localized("Part-Time Coach — KJK Judo Club", "Deeltydse Afrigter — KJK Judo Club", "Umqeqeshi Wesikhashana — KJK Judo Club"), localized("1st Dan, Provincial C Referee, nutrition specialist and school/club coach.", "1ste Dan, Provinsiale C-skeidsregter, voedingspesialis en skool-/klubafrigter.", "I-1st Dan, unompempe wesifundazwe u-C, uchwepheshe wokudla nomqeqeshi wesikole/ weklabhu.")),
        WebsiteInstructor(R.drawable.sensei_reece, "Reece-Hunter Erasmus", localized("Full-Time Coach — KJK Judo Club", "Voltydse Afrigter — KJK Judo Club", "Umqeqeshi Wesikhathi Esigcwele — KJK Judo Club"), localized("3rd Dan, JSA Level 2 Coach and National C Referee specialising in beginners, Kumite and Kata.", "3de Dan, JSA Vlak 2-afrigter en Nasionale C-skeidsregter wat spesialiseer in beginners, Kumite en Kata.", "I-3rd Dan, umqeqeshi we-JSA Level 2 nonompempe kazwelonke u-C ogxile kwabaqalayo, i-Kumite ne-Kata.")),
        WebsiteInstructor(R.drawable.sensei_shasha, "Shasa-Mercedez Erasmus", localized("Full-Time Coach — KJK Judo Club", "Voltydse Afrigter — KJK Judo Club", "Umqeqeshi Wesikhathi Esigcwele — KJK Judo Club"), localized("Provincial C Referee developing young judoka at school and club level.", "Provinsiale C-skeidsregter wat jong judoka op skool- en klubvlak ontwikkel.", "Unompempe wesifundazwe u-C othuthukisa ama-judoka asemasha ezingeni lesikole neleklabhu.")),
        WebsiteInstructor(R.drawable.sensei_shombo, "Okende Shombo Djibril", localized("Coach PJ", "Afrigter PJ", "Umqeqeshi PJ"), localized("Coach and mentor whose judo journey began in Kinshasa and continues in South Africa.", "Afrigter en mentor wie se judo-reis in Kinshasa begin het en in Suid-Afrika voortgaan.", "Umqeqeshi nomeluleki owahamba i-judo eKinshasa futhi oqhubeka eNingizimu Afrika.")),
        WebsiteInstructor(R.drawable.sensei_jean, "Jean Kotze", localized("Part-Time Assistant Coach — KJK Judo Club", "Deeltydse Assistent-afrigter — KJK Judo Club", "Umqeqeshi Ongumsizi Wesikhashana — KJK Judo Club"), localized("1st Dan, Safeguarding-accredited assistant coach and Local Technical Official.", "1ste Dan, beskermingsgeakkrediteerde assistent-afrigter en plaaslike tegniese beampte.", "I-1st Dan, umqeqeshi ongumsizi ogunyazwe ekuvikeleni kanye nesikhulu sendawo sobuchwepheshe.")),
        WebsiteInstructor(R.drawable.sensei_carien, "Carien du Plessis", localized("Head of Fitness & Conditioning", "Hoof van Fiksheid en Kondisionering", "Inhloko Yokuqina Nokulungiselela"), localized("Sho Dan competitive judoka with 14 years of judo experience.", "Sho Dan-mededingende judoka met 14 jaar judo-ervaring.", "I-Sho Dan judoka encintisanayo eneminyaka engu-14 yesipiliyoni se-judo.")),
        WebsiteInstructor(R.drawable.sensei_johan, "Johan Collins", localized("Coach — Golden Score Judo", "Afrigter — Golden Score Judo", "Umqeqeshi — Golden Score Judo"), localized("Coach with 15 years of judo experience, focused on judoka on and off the mat.", "Afrigter met 15 jaar judo-ervaring, gefokus op judoka op en van die mat af.", "Umqeqeshi oneminyaka engu-15 yesipiliyoni se-judo, ogxile kuma-judoka ngaphakathi nangaphandle komata."))
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
    Spacer(Modifier.height(24.dp)); WrjaSectionHeading(localized("Stay connected", "Bly gekoppel", "Hlala uxhumekile"), localized("Our affiliated clubs", "Ons geaffilieerde klubs", "Amaklabhu ethu ahlangene"), localized("Find us on social media!", "Vind ons op sosiale media!", "Sithole ezinkundleni zokuxhumana!"))
    val clubs = listOf(
        WebsiteClub(
            "Golden Score Judo",
            localized("Randfontein-based club and WRJA training community.", "Randfontein-gebaseerde klub en WRJA-oefengemeenskap.", "Iklabhu yase-Randfontein nomphakathi wokuqeqesha we-WRJA."),
            listOf(
                WebsiteClubLink(localized("Search Golden Score Judo on Facebook", "Soek Golden Score Judo op Facebook", "Sesha i-Golden Score Judo ku-Facebook"), "https://www.facebook.com/search/top?q=Golden%20Score%20Judo"),
                WebsiteClubLink(localized("Search Golden Score Judo on Instagram", "Soek Golden Score Judo op Instagram", "Sesha i-Golden Score Judo ku-Instagram"), "https://www.instagram.com/explore/search/keyword/?q=Golden%20Score%20Judo")
            )
        ),
        WebsiteClub(
            "KJK Judo Club",
            localized("West Rand and greater Johannesburg Judo club.", "Wes-Rand- en groter Johannesburg-judo-klub.", "Iklabhu ye-judo yase-West Rand naseGoli elikhulu."),
            listOf(
                WebsiteClubLink(localized("Visit the official KJK Judo website", "Besoek die amptelike KJK Judo-webwerf", "Vakashela iwebhusayithi esemthethweni ye-KJK Judo"), "https://www.kjkjudo.co.za/"),
                WebsiteClubLink(localized("Search KJK Judo on Facebook", "Soek KJK Judo op Facebook", "Sesha i-KJK Judo ku-Facebook"), "https://www.facebook.com/search/top?q=KJK%20Judo%20Club"),
                WebsiteClubLink(localized("Search KJK Judo on Instagram", "Soek KJK Judo op Instagram", "Sesha i-KJK Judo ku-Instagram"), "https://www.instagram.com/")
            )
        ),
        WebsiteClub(
            "West Rand Judo Association",
            localized("Association updates, member clubs and South African Judo information.", "Verenigingsopdaterings, lidklubs en Suid-Afrikaanse judo-inligting.", "Izibuyekezo zenhlangano, amaklabhu angamalungu nolwazi lwe-judo yaseNingizimu Afrika."),
            listOf(
                WebsiteClubLink(localized("Search WRJA on Facebook", "Soek WRJA op Facebook", "Sesha i-WRJA ku-Facebook"), "https://www.facebook.com/search/top?q=West%20Rand%20Judo%20Association"),
                WebsiteClubLink(localized("Search WRJA on Instagram", "Soek WRJA op Instagram", "Sesha i-WRJA ku-Instagram"), "https://www.instagram.com/explore/search/keyword/?q=West%20Rand%20Judo%20Association"),
                WebsiteClubLink(localized("Visit the official Judo South Africa website", "Besoek die amptelike Judo South Africa-webwerf", "Vakashela iwebhusayithi esemthethweni ye-Judo South Africa"), "https://www.judosa.co.za/")
            )
        )
    )
    clubs.forEachIndexed { index, club ->
        WrjaContentCard(Modifier.fillMaxWidth().padding(top = 12.dp).wrjaReveal(index)) {
            Column(Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 16.dp)) {
                Text(club.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(4.dp)); Text(club.summary, color = WrjaMuted, style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(10.dp)); Text(localized("FIND US ON SOCIAL MEDIA", "VIND ONS OP SOSIALE MEDIA", "SITHOLE EZINKUNDLENI ZOKUXHUMANA"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
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
        EventHubItem("01", localized("WRJA ACTIVITIES", "WRJA-AKTIWITEITE", "IMISEBENZI YE-WRJA"), localized("Standard events", "Standaardgeleenthede", "Imicimbi ejwayelekile"), localized("Browse upcoming gradings, training camps and other WRJA events.", "Blaai deur komende graderings, oefenkampe en ander WRJA-geleenthede.", "Bheka ukukleliswa okuzayo, amakamu okuqeqesha neminye imicimbi ye-WRJA."), localized("VIEW STANDARD EVENTS", "BEKYK STANDAARDGELEENTHEDE", "BONA IMICIMBI EJWAYELEKILE",), onStandardEventsClick),
        EventHubItem("02", localized("DATES & FIXTURES", "DATUMS EN WEDSTRYDE", "IZINSUKU NEMIDLALO"), localized("Calendar", "Kalender", "Ikhalenda"), localized("View upcoming WRJA events, training milestones and important dates.", "Sien komende WRJA-geleenthede, oefenmylpale en belangrike datums.", "Bona imicimbi ezayo ye-WRJA, amagalelo okuqeqesha nezinsuku ezibalulekile."), localized("OPEN CALENDAR", "MAAK KALENDER OOP", "VULA IKHALENDA"), onCalendarClick),
        EventHubItem("03", localized("ON THE MAT", "OP DIE MAT", "EMATENI"), localized("Competitions", "Kompetisies", "Imiqhudelwano"), localized("Find registrations, payment requirements and information for every competition.", "Vind registrasies, betalingsvereistes en inligting vir elke kompetisie.", "Thola ukubhalisa, izidingo zokukhokha nolwazi lwawo wonke umncintiswano."), localized("EXPLORE COMPETITIONS", "VERKEN KOMPETISIES", "HLOLA IMIQHUDELWANO"), onCompetitionsClick),
        EventHubItem("04", localized("SCHOOL JUDO", "SKOOLJUDO", "I-JUDO YEZIKOLE"), localized("Schools", "Skole", "Izikole"), localized("Explore the SA Schools Novice and SA Schools Advanced pathways.", "Verken die SA Schools Novice- en SA Schools Advanced-roetes.", "Hlola izindlela ze-SA Schools Novice ne-SA Schools Advanced."), localized("VIEW SCHOOLS EVENTS", "BEKYK SKOOLGELEENTHEDE", "BONA IMICIMBI YEZIKOLE"), onSchoolsClick),
        EventHubItem("05", "WRJA KIT", localized("Store", "Winkel", "Isitolo"), localized("Order WRJA and JSA tracksuits and request official WRJA posters.", "Bestel WRJA- en JSA-sweetpakke en versoek amptelike WRJA-plakkate.", "Oda ama-tracksuit e-WRJA ne-JSA bese ucela amaphosta asemthethweni e-WRJA."), localized("VISIT STORE", "BESOEK WINKEL", "VAKASHELA ISITOLO"), onStoreClick)
    )

    WrjaSectionHeading(
        localized("Your WRJA event hub", "Jou WRJA-geleentheidsentrum", "Isikhungo sakho semicimbi ye-WRJA"),
        localized("Everything happening around the mat.", "Alles wat rondom die mat gebeur.", "Konke okwenzeka eduze komata."),
        localized("Explore the calendar, competitions, school pathways and official WRJA kit from one clear starting point.", "Verken die kalender, kompetisies, skoolroetes en amptelike WRJA-drag vanaf een duidelike beginpunt.", "Hlola ikhalenda, imincintiswano, izindlela zezikole nezimpahla ezisemthethweni ze-WRJA endaweni eyodwa ecacile.")
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
    WrjaSectionHeading(localized("Get in touch", "Kontak ons", "Xhumana nathi"), localized("Contact the WRJA team", "Kontak die WRJA-span", "Xhumana nethimba le-WRJA"), localized("Use the form above to send a message, or find the club details below.", "Gebruik die vorm hierbo om 'n boodskap te stuur, of vind die klubbesonderhede hieronder.", "Sebenzisa ifomu elingenhla ukuthumela umlayezo, noma uthole imininingwane yeklabhu ngezansi."))
    Spacer(Modifier.height(20.dp)); Text(localized("CLUB CONTACTS", "KLUBKONTAKTE", "OXHUMANA NABO BEKLABHU"), color = WrjaGold, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.ExtraBold)
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
                Text(localized("OPEN IN MAPS  ↗", "MAAK IN KAARTE OOP  ↗", "VULA KUMAMEPHU  ↗"), color = WrjaGold, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}
