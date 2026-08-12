package za.co.wrja.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) = super.onCreate(savedInstanceState).also {
        setContent { MaterialTheme { WRJAApp() } }
    }
}

@Composable private fun WRJAApp() {
    var screen by rememberSaveable { mutableStateOf("login") }
    when (screen) {
        "login" -> LoginScreen({ screen = "signup" }, { screen = "home" })
        "signup" -> SignUpScreen({ screen = "login" }, { screen = "home" })
        else -> MainSite(screen, { screen = "login" }) { screen = it }
    }
}

@Composable private fun Logo() = Box(Modifier.size(58.dp).background(Color.White), contentAlignment = Alignment.Center) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) { Text("WRJA", color = Charcoal, fontWeight = FontWeight.Black); Text("JUDO", color = GoldDark, fontSize = 8.sp, letterSpacing = 1.sp) }
}
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
    var page by rememberSaveable { mutableStateOf(initial) }; val drawer = rememberDrawerState(DrawerValue.Closed); val scope = rememberCoroutineScope(); val pages = listOf("Home", "About", "Events", "Programs", "News", "Gallery", "Contact")
    ModalNavigationDrawer(drawerState = drawer, drawerContent = { ModalDrawerSheet { Column(Modifier.fillMaxHeight().background(Charcoal)) { Row(Modifier.padding(22.dp), verticalAlignment = Alignment.CenterVertically) { Logo(); Spacer(Modifier.width(12.dp)); Text("WEST RAND\nJUDO ASSOCIATION", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) }; pages.forEach { p -> Text(p, Modifier.fillMaxWidth().clickable { page = p.lowercase(); update(page); scope.launch { drawer.close() } }.padding(18.dp), color = if (p.equals(page, true)) Gold else Color.White, fontWeight = FontWeight.SemiBold) }; Spacer(Modifier.weight(1f)); Text("LOG OUT", Modifier.clickable { logout() }.padding(22.dp), color = Gold, fontWeight = FontWeight.Bold) } } }) {
        Scaffold(topBar = { TopAppBar(title = { Text("WEST RAND JUDO", fontWeight = FontWeight.Black, fontSize = 16.sp) }, navigationIcon = { IconButton({ scope.launch { drawer.open() } }) { Icon(Icons.Default.Menu, "Menu") } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Charcoal, titleContentColor = Color.White, navigationIconContentColor = Color.White)) }) { padding -> SitePage(page, Modifier.padding(padding)) }
    }
}

@Composable private fun SitePage(page: String, modifier: Modifier) {
    val descriptions = mapOf("home" to "Building discipline, respect, and excellence through judo for athletes of all ages across the West Rand community.", "about" to "Building character on and off the mat. We develop confident, disciplined and respectful individuals through judo.", "events" to "Club gradings, competitions and training activities.", "programs" to "Judo programmes for children and adults at every level.", "news" to "Competition results and achievements from WRJA athletes.", "gallery" to "Training, competition and community moments.", "contact" to "Send us a message or contact our training venues.")
    val title = page.replaceFirstChar { it.uppercase() }
    LazyColumn(modifier.fillMaxSize().background(Color.White)) { item { Box(Modifier.fillMaxWidth().height(if (page == "home") 320.dp else 160.dp).background(Charcoal2), contentAlignment = if (page == "home") Alignment.BottomStart else Alignment.Center) { Column(Modifier.padding(28.dp), horizontalAlignment = if (page == "home") Alignment.Start else Alignment.CenterHorizontally) { Text(if (page == "home") "WELCOME TO\nWEST RAND JUDO\nASSOCIATION" else title.uppercase(), color = Color.White, fontSize = if (page == "home") 29.sp else 30.sp, fontWeight = FontWeight.Bold); Text(if (page == "home") "DISCIPLINE  •  RESPECT  •  EXCELLENCE" else "HOME  /  $title", color = Gold, fontSize = 11.sp, letterSpacing = 1.sp) } } }; item { Column(Modifier.padding(24.dp)) { Text(descriptions[page] ?: "", color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 19.sp, lineHeight = 28.sp); Spacer(Modifier.height(20.dp)); if (page == "contact") ContactForm() else ContentCards(page) } } }
}

@Composable private fun ContentCards(page: String) {
    val content = when (page) { "programs" -> listOf("Kids Judo" to "Balance, safe falling, discipline and confidence.", "Adult Judo" to "Throws, groundwork and conditioning for all grades.", "Women's Judo" to "A supportive space to train, compete and grow."); "news" -> listOf("National success for Golden Score judokas" to "Four gold, six silver and four bronze medals.", "African Cup medals" to "KJK athletes celebrated multiple podium finishes.", "Athlete spotlight" to "West Rand judokas excel nationally."); "events" -> listOf("Events calendar" to "Navigate monthly dates for club events.", "Club grading" to "A clear belt-progression pathway.", "Training camps" to "Special development sessions."); "gallery" -> listOf("ALL  |  ADULTS  |  KIDS  |  COMPETITIONS" to "Tap a category to filter the gallery.", "Training photos" to "Photo placeholders until artwork is added.", "Competition photos" to "Display-only gallery cards."); else -> listOf("Our mission" to "Safe, professional and inclusive judo training.", "Certified coaches" to "Qualified coaches with years of experience.", "Affiliated clubs" to "Golden Score Judo and KJK Judo.") }
    content.forEach { (heading, text) -> Card(Modifier.fillMaxWidth().padding(bottom = 14.dp), elevation = CardDefaults.cardElevation(3.dp)) { Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) { Box(Modifier.size(52.dp).background(if (page == "gallery") Charcoal else Color(0x22C9A227)), contentAlignment = Alignment.Center) { Text(if (page == "gallery") "PHOTO" else "WRJA", color = Gold, fontSize = 9.sp, fontWeight = FontWeight.Bold) }; Spacer(Modifier.width(15.dp)); Column { Text(heading, fontWeight = FontWeight.Bold, fontSize = 17.sp); Text(text, color = Muted, fontSize = 14.sp, lineHeight = 20.sp) } } } }
    if (page == "home") { Spacer(Modifier.height(8.dp)); Button({}, colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink)) { Text("BOOK A FREE TRIAL") } }
}

@Composable private fun ContactForm() { var name by remember { mutableStateOf("") }; var email by remember { mutableStateOf("") }; var message by remember { mutableStateOf("") }; Text("SEND US A MESSAGE", fontSize = 23.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.height(14.dp)); OutlinedTextField(name, { name = it }, label = { Text("Your name") }, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(10.dp)); OutlinedTextField(email, { email = it }, label = { Text("Email address") }, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(10.dp)); OutlinedTextField(message, { message = it }, label = { Text("Message") }, minLines = 3, modifier = Modifier.fillMaxWidth()); Spacer(Modifier.height(14.dp)); Button({}, colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink)) { Text("SEND MESSAGE") }; Spacer(Modifier.height(28.dp)); Text("CONTACT INFO", fontSize = 23.sp, fontWeight = FontWeight.Bold); Text("Golden Score Judo Dojo\n104 Stegman St, Randgate, Randfontein\n078 870 9131\n\nKJK Judo\nNGK Paardekraal, Krugersdorp\n083 329 5923\n\nWest Rand Judo Association\n3 Octavia, 49 Otto Street, Krugersdorp North", color = Muted, lineHeight = 22.sp) }
