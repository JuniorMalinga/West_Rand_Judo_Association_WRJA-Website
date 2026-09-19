package za.co.wrja.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

private val Charcoal = Color(0xFF161616)
private val Charcoal2 = Color(0xFF1F1F1F)
private val Gold = Color(0xFFC9A227)
private val GoldDark = Color(0xFF8A6E1A)
private val OffWhite = Color(0xFFF4F4F4)
private val Ink = Color(0xFF1A1A1A)
private val Muted = Color(0xFF555555)

/** Presentation model ready to be populated by a future chat service. */
private data class ChatMessageUi(val text: String, val fromAssistant: Boolean)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) = super.onCreate(savedInstanceState).also {
        setContent { MaterialTheme { WRJAApp() } }
    }
}

@Composable private fun WRJAApp() {
    var screen by rememberSaveable { mutableStateOf("login") }
    AnimatedContent(
        targetState = screen,
        transitionSpec = { (slideInHorizontally { it / 7 } + fadeIn()) togetherWith (slideOutHorizontally { -it / 7 } + fadeOut()) },
        label = "app screen transition"
    ) { targetScreen ->
        when (targetScreen) {
            "login" -> LoginScreen({ screen = "signup" }, { screen = "home" })
            "signup" -> SignUpScreen({ screen = "login" }, { screen = "home" })
            else -> MainSite(targetScreen, { screen = "login" }) { screen = it }
        }
    }
}

@Composable private fun Logo() = Box(Modifier.size(58.dp).background(Color.White), contentAlignment = Alignment.Center) { Image(painterResource(R.drawable.wrja_logo), "West Rand Judo Association logo", Modifier.padding(5.dp).fillMaxSize(), contentScale = ContentScale.Fit) }
@Composable private fun Header(title: String) = Box(Modifier.fillMaxWidth().height(136.dp).background(Charcoal), contentAlignment = Alignment.Center) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) { Text(title.uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 30.sp); Text("HOME  /  $title", color = Gold, fontSize = 11.sp, letterSpacing = 1.sp) }
}

@Composable private fun LoginScreen(signUp: () -> Unit, login: () -> Unit) {
    var email by rememberSaveable { mutableStateOf("") }; var password by rememberSaveable { mutableStateOf("") }; var remember by rememberSaveable { mutableStateOf(false) }
    LazyColumn(Modifier.fillMaxSize().background(OffWhite), horizontalAlignment = Alignment.CenterHorizontally) {
        item { Header("Login"); Spacer(Modifier.height(32.dp)) }
        item { Card(Modifier.padding(24.dp).fillMaxWidth(), elevation = CardDefaults.cardElevation(10.dp)) { Column(Modifier.padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Logo(); Spacer(Modifier.height(18.dp)); Text("Welcome back", fontSize = 26.sp, fontWeight = FontWeight.Bold); Text("Log in to manage your registrations, view grading history, and stay up to date with the club.", color = Muted, textAlign = TextAlign.Center, fontSize = 14.sp); Spacer(Modifier.height(24.dp))
            OutlinedTextField(email, { email = it }, label = { Text("Email address") }, placeholder = { Text("you@example.com") }, singleLine = true, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(14.dp)); OutlinedTextField(password, { password = it }, label = { Text("Password") }, placeholder = { Text("Your password") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) { Row(verticalAlignment = Alignment.CenterVertically) { Checkbox(remember, { remember = it }, colors = CheckboxDefaults.colors(checkedColor = Gold)); Text("Remember me", fontSize = 13.sp) }; Text("Forgot password?", color = GoldDark, fontSize = 13.sp, fontWeight = FontWeight.Bold) }
            Button(login, Modifier.fillMaxWidth().height(52.dp), colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink)) { Text("LOG IN", fontWeight = FontWeight.Bold) }; Spacer(Modifier.height(18.dp)); Text("Don't have an account? Sign up", Modifier.clickable { signUp() }, color = GoldDark, fontWeight = FontWeight.Bold)
        } } }
    }
}

@Composable private fun SignUpScreen(back: () -> Unit, create: () -> Unit) {
    var parent by rememberSaveable { mutableStateOf(false) }; var name by rememberSaveable { mutableStateOf("") }; var email by rememberSaveable { mutableStateOf("") }; var phone by rememberSaveable { mutableStateOf("") }
    LazyColumn(Modifier.fillMaxSize().background(OffWhite), horizontalAlignment = Alignment.CenterHorizontally) { item { Header("Sign up") }; item { Card(Modifier.padding(24.dp).fillMaxWidth()) { Column(Modifier.padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Logo(); Spacer(Modifier.height(16.dp)); Text("Create your account", fontSize = 25.sp, fontWeight = FontWeight.Bold); Text("Register as an athlete, or as a parent/guardian managing a child's membership.", color = Muted, textAlign = TextAlign.Center, fontSize = 14.sp); Spacer(Modifier.height(18.dp))
        Row(Modifier.fillMaxWidth()) { Toggle("ATHLETE", !parent) { parent = false }; Toggle("PARENT / GUARDIAN", parent) { parent = true } }; Spacer(Modifier.height(12.dp)); OutlinedTextField(name, { name = it }, label = { Text("Full name") }, modifier = Modifier.fillMaxWidth()); if (parent) { Spacer(Modifier.height(12.dp)); OutlinedTextField("", {}, label = { Text("Child's full name") }, modifier = Modifier.fillMaxWidth()) }; Spacer(Modifier.height(12.dp)); OutlinedTextField(email, { email = it }, label = { Text("Email address") }, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(12.dp)); OutlinedTextField(phone, { phone = it }, label = { Text("Phone number") }, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(12.dp)); OutlinedTextField("", {}, label = { Text("Password") }, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(16.dp)); Button(create, Modifier.fillMaxWidth().height(52.dp), colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink)) { Text("CREATE ACCOUNT", fontWeight = FontWeight.Bold) }; Spacer(Modifier.height(16.dp)); Text("Already have an account? Log in", Modifier.clickable { back() }, color = GoldDark, fontWeight = FontWeight.Bold)
    } } } }
}
@Composable private fun RowScope.Toggle(text: String, active: Boolean, action: () -> Unit) = Text(text, Modifier.weight(1f).background(if (active) Gold else OffWhite).clickable { action() }.padding(13.dp), textAlign = TextAlign.Center, fontSize = 11.sp, fontWeight = FontWeight.Bold)

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun MainSite(initial: String, logout: () -> Unit, update: (String) -> Unit) {
    var page by rememberSaveable { mutableStateOf(initial) }; val drawer = rememberDrawerState(DrawerValue.Closed); val scope = rememberCoroutineScope(); val pages = listOf("Home", "About", "Events", "Programs", "News", "Gallery", "Contact", "Chat Assistant")
    ModalNavigationDrawer(drawerState = drawer, drawerContent = { ModalDrawerSheet { Column(Modifier.fillMaxHeight().background(Charcoal)) { Row(Modifier.padding(22.dp), verticalAlignment = Alignment.CenterVertically) { Logo(); Spacer(Modifier.width(12.dp)); Text("WEST RAND\nJUDO ASSOCIATION", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) }; pages.forEach { p -> Text(p, Modifier.fillMaxWidth().clickable { page = p.lowercase(); update(page); scope.launch { drawer.close() } }.padding(18.dp), color = if (p.equals(page, true)) Gold else Color.White, fontWeight = FontWeight.SemiBold) }; Spacer(Modifier.weight(1f)); Text("LOG OUT", Modifier.clickable { logout() }.padding(22.dp), color = Gold, fontWeight = FontWeight.Bold) } } }) {
        Scaffold(topBar = { TopAppBar(title = { Text("WEST RAND JUDO", fontWeight = FontWeight.Black, fontSize = 16.sp) }, navigationIcon = { IconButton({ scope.launch { drawer.open() } }) { Icon(Icons.Default.Menu, "Menu") } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Charcoal, titleContentColor = Color.White, navigationIconContentColor = Color.White)) }) { padding -> AnimatedContent(targetState = page, transitionSpec = { (slideInHorizontally { it / 9 } + fadeIn()) togetherWith (slideOutHorizontally { -it / 9 } + fadeOut()) }, label = "site page transition") { targetPage -> SitePage(targetPage, Modifier.padding(padding)) } }
    }
}

@Composable private fun SitePage(page: String, modifier: Modifier) {
    val descriptions = mapOf("home" to "Building discipline, respect, and excellence through judo for athletes of all ages across the West Rand community.", "about" to "Building character on and off the mat. We develop confident, disciplined and respectful individuals through judo.", "events" to "Club gradings, competitions and training activities.", "programs" to "Judo programmes for children and adults at every level.", "news" to "Competition results and achievements from WRJA athletes.", "gallery" to "Training, competition and community moments.", "contact" to "Send us a message or contact our training venues.", "chat assistant" to "Your WRJA guide for training, programmes, events and club information.")
    val title = page.replaceFirstChar { it.uppercase() }
    LazyColumn(modifier.fillMaxSize().background(Color.White)) { item { Box(Modifier.fillMaxWidth().height(if (page == "home") 320.dp else 160.dp).background(Charcoal2), contentAlignment = if (page == "home") Alignment.BottomStart else Alignment.Center) { Column(Modifier.padding(28.dp), horizontalAlignment = if (page == "home") Alignment.Start else Alignment.CenterHorizontally) { Text(if (page == "home") "WELCOME TO\nWEST RAND JUDO\nASSOCIATION" else title.uppercase(), color = Color.White, fontSize = if (page == "home") 29.sp else 30.sp, fontWeight = FontWeight.Bold); Text(if (page == "home") "DISCIPLINE  •  RESPECT  •  EXCELLENCE" else "HOME  /  $title", color = Gold, fontSize = 11.sp, letterSpacing = 1.sp) } } }; item { Column(Modifier.padding(24.dp)) { Text(descriptions[page] ?: "", color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 19.sp, lineHeight = 28.sp); Spacer(Modifier.height(20.dp)); when (page) { "contact" -> ContactForm(); "chat assistant" -> ChatAssistantScreen(); else -> ContentCards(page) } } } }
}

@Composable private fun ContentCards(page: String) {

    if (page == "programs") {
        SupabasePrograms()
        return
    }
    val content = when (page) {
        "programs" -> listOf("Kids Judo" to "Balance, safe falling, discipline and confidence.", "Adult Judo" to "Throws, groundwork and conditioning for all grades.", "Women's Judo" to "A supportive space to train, compete and grow.")
        "news" -> listOf("National success for Golden Score judokas" to "Golden Score athletes earned four gold, six silver and four bronze medals at the National Schools and SA Open Judo Championships.", "African Cup medals" to "KJK Judo athletes brought home gold, silver and bronze results from the African Cup tournament.", "Africa's best" to "Dane van Heerden won Cadet Boys under-50kg gold, while Madison Lombaard earned silver.")
        "events" -> listOf("Events calendar" to "Use the monthly calendar below to plan around association activities, competitions and gradings.", "Club gradings" to "A clear belt-progression pathway with regular opportunities to demonstrate growth.", "Training camps" to "Special development sessions, seminars and club activities are published here as dates are confirmed.")
        "gallery" -> listOf("Browse the gallery" to "Filter moments from Kids Judo, Adult Judo and competitions. Tap an image to view it in a future lightbox update.", "Training" to "Technique, teamwork and regular dojo sessions across our member clubs.", "Competition" to "Celebrating athletes representing the West Rand on regional, national and African stages.")
        else -> listOf("Our mission" to "To develop confident, disciplined and respectful individuals through the practice of judo.", "Our values" to "Respect, discipline, integrity, perseverance and continuous self-improvement guide every session.", "A strong community" to "We support athletes, families, coaches, referees and officials across recreational to international levels.")
    }
    content.forEachIndexed { index, (heading, text) -> Card(Modifier.fillMaxWidth().height(if (page == "programs") 190.dp else 112.dp).padding(bottom = 14.dp), elevation = CardDefaults.cardElevation(3.dp)) { Box { if (page == "programs") { val image = listOf(R.drawable.kids_judo, R.drawable.adult_judo, R.drawable.womens_judo)[index]; Image(painterResource(image), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop); Box(Modifier.fillMaxSize().background(Color(0x99000000))) }; Row(Modifier.padding(18.dp).align(Alignment.BottomStart), verticalAlignment = Alignment.CenterVertically) { if (page != "programs") { Box(Modifier.size(52.dp).background(if (page == "gallery") Charcoal else Color(0x22C9A227)), contentAlignment = Alignment.Center) { Text(if (page == "gallery") "PHOTO" else "WRJA", color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Bold) }; Spacer(Modifier.width(15.dp)) }; Column { Text(heading, fontWeight = FontWeight.Bold, fontSize = 17.sp, color = if (page == "programs") Color.White else Ink); Text(text, color = if (page == "programs") Color.LightGray else Muted, fontSize = 14.sp, lineHeight = 20.sp) } } } } }
    when (page) {
        "home" -> { Spacer(Modifier.height(8.dp)); Button({}, colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink)) { Text("BOOK A FREE TRIAL") } }
        "about" -> AboutDetail()
        "events" -> EventsCalendarPreview()
        "news" -> NewsDetailList()
        "gallery" -> GalleryPhotoGrid()
    }
}

@Composable private fun ContactForm() { var name by remember { mutableStateOf("") }; var email by remember { mutableStateOf("") }; var message by remember { mutableStateOf("") }; Text("SEND US A MESSAGE", fontSize = 23.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.height(14.dp)); OutlinedTextField(name, { name = it }, label = { Text("Your name") }, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(10.dp)); OutlinedTextField(email, { email = it }, label = { Text("Email address") }, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(10.dp)); OutlinedTextField(message, { message = it }, label = { Text("Message") }, minLines = 3, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(14.dp)); Button({}, colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink)) { Text("SEND MESSAGE") }; Spacer(Modifier.height(28.dp)); Text("CONTACT INFO", fontSize = 23.sp, fontWeight = FontWeight.Bold); Text("Golden Score Judo Dojo\n104 Stegman St, Randgate, Randfontein\n078 870 9131\n\nKJK Judo\nNGK Paardekraal, Krugersdorp\n083 329 5923\n\nWest Rand Judo Association\n3 Octavia, 49 Otto Street, Krugersdorp North", color = Muted, lineHeight = 22.sp) }

@Composable private fun AboutDetail() {
    Spacer(Modifier.height(18.dp)); Text("OUR INSTRUCTORS & FACILITATORS", fontSize = 22.sp, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(12.dp)); InstructorDetail("Sensei Katja Bruwer", "Director — KJK Judo Club", "7th Dan, former South African national team captain and IJF-qualified coach. With more than four decades in judo, she has developed athletes from grassroots to Commonwealth and African levels.", R.drawable.sensei_katja)
    InstructorDetail("Sensei Michelle Diamond", "Founder & Director — Golden Score Judo", "3rd Dan Black Belt and Sport Psychology graduate. Her coaching combines competitive athlete development with character, discipline, respect and personal growth.", R.drawable.sensei_michelle)
    Text("AFFILIATED CLUBS", fontSize = 22.sp, fontWeight = FontWeight.Bold); Text("Golden Score Judo and KJK Judo work together under the WRJA community to create accessible, high-quality training opportunities.", color = Muted, lineHeight = 21.sp)
}

@Composable private fun InstructorDetail(name: String, role: String, bio: String, photo: Int) {
    Card(Modifier.fillMaxWidth().padding(bottom = 16.dp)) { Column { Box(Modifier.fillMaxWidth().height(240.dp).background(Charcoal2), contentAlignment = Alignment.Center) { Image(painterResource(photo), null, Modifier.fillMaxSize().padding(8.dp), contentScale = ContentScale.Fit) }; Column(Modifier.padding(16.dp)) { Text(name, fontWeight = FontWeight.Bold, fontSize = 19.sp); Text(role.uppercase(), color = GoldDark, fontSize = 12.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.height(6.dp)); Text(bio, color = Muted, fontSize = 14.sp, lineHeight = 20.sp) } } }
}

@Composable private fun EventsCalendarPreview() {
    Spacer(Modifier.height(16.dp)); Text("AUGUST 2026", fontSize = 22.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(12.dp));
    Column(Modifier.fillMaxWidth().background(OffWhite)) { Row(Modifier.fillMaxWidth().background(GoldDark)) { listOf("M", "T", "W", "T", "F", "S", "S").forEach { Text(it, Modifier.weight(1f).padding(vertical = 10.dp), textAlign = TextAlign.Center, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold) } }; val days = listOf("", "", "", "", "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"); days.chunked(7).forEach { week -> Row(Modifier.fillMaxWidth()) { week.forEach { day -> Box(Modifier.weight(1f).aspectRatio(1f).padding(1.dp).background(if (day == "12") Gold else Color.White), contentAlignment = Alignment.Center) { Text(day, color = if (day == "12") Ink else Ink, fontSize = 13.sp, fontWeight = if (day == "12") FontWeight.Bold else FontWeight.Normal) } } } } }; Spacer(Modifier.height(14.dp)); Text("Dates are presentation-only at this stage. Event details will be connected when the scheduling backend is added.", color = Muted, fontSize = 13.sp, lineHeight = 19.sp)
}

@Composable private fun NewsDetailList() {
    Spacer(Modifier.height(18.dp)); Text("LATEST STORIES", fontSize = 22.sp, fontWeight = FontWeight.Bold); NewsStory(R.drawable.news_1, "4 August 2026", "Competition", "National success for Golden Score judokas", "Golden Score athletes returned from the National Schools and SA Open Judo Championships in Gqeberha with four gold, six silver and four bronze medals across multiple age divisions."); NewsStory(R.drawable.news_2, "24 July 2026", "Competition", "4 KJK Judo athletes claim medals at African Cup", "Tia Sheppard, Shasa-Mercedez Erasmus, Adriaan Jansen van Vuuren and Nico Sheppard combined for medal-winning performances.")
    Text("NEWSLETTER", fontSize = 20.sp, fontWeight = FontWeight.Bold); Text("Subscribe to stay up to date with club results, announcements and upcoming events.", color = Muted); Spacer(Modifier.height(8.dp)); OutlinedTextField("", {}, label = { Text("Enter your email") }, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(10.dp)); Button({}, colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink)) { Text("SUBSCRIBE") }
}

@Composable private fun NewsStory(photo: Int, date: String, category: String, title: String, excerpt: String) {
    Card(Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 8.dp)) { Column { Image(painterResource(photo), null, Modifier.fillMaxWidth().height(180.dp), contentScale = ContentScale.Crop); Column(Modifier.padding(16.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(date, color = Muted, fontSize = 11.sp); Text(category.uppercase(), color = GoldDark, fontSize = 11.sp, fontWeight = FontWeight.Bold) }; Spacer(Modifier.height(6.dp)); Text(title, fontSize = 19.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.height(6.dp)); Text(excerpt, color = Muted, fontSize = 14.sp, lineHeight = 20.sp); Spacer(Modifier.height(8.dp)); Text("READ ARTICLE  →", color = GoldDark, fontSize = 12.sp, fontWeight = FontWeight.Bold) } } }
}

@Composable private fun GalleryPhotoGrid() {
    Spacer(Modifier.height(18.dp)); Text("PHOTO GALLERY", fontSize = 22.sp, fontWeight = FontWeight.Bold); Text("ALL    KIDS JUDO    ADULT JUDO    WOMEN'S JUDO    COMPETITIONS", color = GoldDark, fontSize = 10.sp, fontWeight = FontWeight.Bold, lineHeight = 19.sp); Spacer(Modifier.height(12.dp));
    val photos = listOf(R.drawable.gallery_adult_1 to "Adult Judo training", R.drawable.gallery_competition_1 to "Competition action", R.drawable.gallery_kid_1 to "Kids Judo training"); photos.chunked(2).forEach { row -> Row(Modifier.fillMaxWidth()) { row.forEach { (photo, caption) -> Box(Modifier.weight(1f).height(145.dp).padding(4.dp)) { Image(painterResource(photo), caption, Modifier.fillMaxSize(), contentScale = ContentScale.Crop); Box(Modifier.fillMaxWidth().align(Alignment.BottomCenter).background(Color(0x99000000)).padding(7.dp)) { Text(caption, color = Color.White, fontSize = 11.sp) } } }; if (row.size == 1) Spacer(Modifier.weight(1f)) } }; Text("More images will appear here as the gallery grows. Image selection and lightbox browsing are display-only until backend/content administration is connected.", color = Muted, fontSize = 13.sp, lineHeight = 19.sp, modifier = Modifier.padding(top = 10.dp))
}

@Composable private fun ChatAssistantScreen() {
    // Replace this local sample list with messages from the authenticated chat session later.
    val messages = listOf(
        ChatMessageUi("Hello! I’m the WRJA Assistant. How can I help with your judo journey today?", true),
        ChatMessageUi("I can help you find a programme, prepare for an event, or point you to the right club contact.", true)
    )
    var draft by rememberSaveable { mutableStateOf("") }

    Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Charcoal)) {
        Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(44.dp).background(Gold), contentAlignment = Alignment.Center) { Text("WR", color = Ink, fontWeight = FontWeight.Black, fontSize = 14.sp) }
            Spacer(Modifier.width(12.dp))
            Column {
                Text("WRJA ASSISTANT", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("●  Online when connected", color = Gold, fontSize = 12.sp)
            }
        }
    }
    Spacer(Modifier.height(16.dp))
    messages.forEach { message -> ChatBubble(message) }
    Spacer(Modifier.height(12.dp))
    Text("SUGGESTED QUESTIONS", color = GoldDark, fontWeight = FontWeight.Bold, fontSize = 11.sp, letterSpacing = 0.7.sp)
    Spacer(Modifier.height(8.dp))
    listOf("Which programme is right for me?", "How do I book a free trial?", "What events are coming up?").forEach { suggestion ->
        AssistChip(onClick = { draft = suggestion }, label = { Text(suggestion, fontSize = 12.sp) }, colors = AssistChipDefaults.assistChipColors(containerColor = OffWhite, labelColor = Ink), modifier = Modifier.padding(end = 6.dp, bottom = 6.dp))
    }
    Spacer(Modifier.height(14.dp))
    Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = OffWhite)) {
        Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(value = draft, onValueChange = { draft = it }, placeholder = { Text("Ask the WRJA Assistant…") }, modifier = Modifier.weight(1f), singleLine = true, colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Gold, unfocusedBorderColor = Color.LightGray))
            Spacer(Modifier.width(8.dp))
            IconButton(onClick = { /* Future backend: submit draft and stream assistant response. */ }, enabled = draft.isNotBlank(), colors = IconButtonDefaults.iconButtonColors(contentColor = Ink, disabledContentColor = Muted)) { Icon(Icons.Default.Send, "Send message") }
        }
    }
    Text("Chat is a UI preview only. Messages will be sent securely once the WRJA chat backend is connected.", color = Muted, fontSize = 11.sp, lineHeight = 16.sp, modifier = Modifier.padding(top = 10.dp))
}

@Composable private fun ChatBubble(message: ChatMessageUi) {
    Row(Modifier.fillMaxWidth().padding(bottom = 10.dp), horizontalArrangement = if (message.fromAssistant) Arrangement.Start else Arrangement.End) {
        Surface(color = if (message.fromAssistant) OffWhite else Gold, shape = MaterialTheme.shapes.medium, tonalElevation = 1.dp) {
            Text(message.text, Modifier.padding(horizontal = 15.dp, vertical = 12.dp).widthIn(max = 265.dp), color = Ink, fontSize = 14.sp, lineHeight = 20.sp)
        }
    }
}
