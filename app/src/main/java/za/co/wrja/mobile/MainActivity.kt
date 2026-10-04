package za.co.wrja.mobile

import android.os.Bundle
import android.hardware.fingerprint.FingerprintManager
import androidx.activity.compose.LocalActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ComposeView
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
private val Charcoal = Color(0xFF090909)
private val Charcoal2 = Color(0xFF171717)
private val Gold = Color(0xFFF1BD16)
private val GoldDark = Color(0xFFF1BD16)
private val OffWhite = Color(0xFF090909)
private val Ink = Color(0xFFF5F5F5)
private val Muted = Color(0xFFA6A6A6)
private val WRJAColorScheme = darkColorScheme(
    primary = Gold,
    onPrimary = Charcoal,
    background = Charcoal,
    onBackground = Ink,
    surface = Charcoal2,
    onSurface = Ink,
    surfaceVariant = Color(0xFF242424),
    onSurfaceVariant = Muted,
    outline = Color(0xFF555555)
)

/** Conversation model; a remote chat service can use this same shape later. */
private data class ChatMessageUi(val text: String, val fromAssistant: Boolean)

private fun localChatReply(question: String, language: AppLanguage): String {
    val query = question.lowercase()
    val topic = when {
        listOf("what is judo", "wat is judo", "iyini i-judo", "about judo").any(query::contains) -> "what_is_judo"
        listOf("what is a gi", "what is gi", "judogi", "wat is 'n gi", "iyini i-gi").any(query::contains) -> "gi"
        listOf("compete", "tournament", "championship", "competeer", "toernooi", "qhudelana", "umncintiswano").any(query::contains) -> "compete"
        listOf("throw", "grappling", "groundwork", "technique", "gooi", "tegniek", "ukuphonsa").any(query::contains) -> "technique"
        listOf("where", "location", "address", "waar", "ligging", "kuphi", "ikheli").any(query::contains) -> "location"
        listOf("coach", "instructor", "sensei", "afrigter", "umqeqeshi").any(query::contains) -> "coaches"
        listOf("parent", "guardian", "ouers", "umzali").any(query::contains) -> "parents"
        listOf("cancel", "change booking", "reschedule", "kanselleer", "skuif", "khansela").any(query::contains) -> "booking_change"
        listOf("program", "programme", "uhlelo").any(query::contains) -> "programme"
        listOf("trial", "proef", "isivivinyo", "book", "bespreek", "bhukha").any(query::contains) -> "trial"
        listOf("event", "geleentheid", "umcimbi", "competition", "grading").any(query::contains) -> "events"
        listOf("contact", "kontak", "xhumana", "club", "klub").any(query::contains) -> "contact"
        listOf("time", "schedule", "class", "when", "tyd", "klas", "isikhathi").any(query::contains) -> "schedule"
        listOf("cost", "price", "fee", "pay", "kost", "fooi", "imali", "khokha").any(query::contains) -> "fees"
        listOf("child", "kid", "age", "kind", "ouderdom", "ingane", "iminyaka").any(query::contains) -> "ages"
        listOf("uniform", "clothes", "klere", "umfaniswano").any(query::contains) -> "uniform"
        listOf("belt", "rank", "grade", "gordel", "ibhandi", "izinga").any(query::contains) -> "belts"
        listOf("safe", "safety", "injury", "veilig", "besering", "pheph").any(query::contains) -> "safety"
        listOf("join", "member", "register", "sign up", "lid", "registreer", "bhalisa").any(query::contains) -> "membership"
        listOf("newsletter", "subscribe", "nuusbrief", "bhalisela").any(query::contains) -> "newsletter"
        listOf("hello", "hi", "hallo", "sawubona").any(query::contains) -> "greeting"
        else -> "other"
    }

    return when (language) {
        AppLanguage.ENGLISH -> when (topic) {
            "what_is_judo" -> "Judo is a Japanese martial art and Olympic sport. It teaches safe throws, pins, movement, fitness, discipline and respect through controlled partner practice."
            "gi" -> "A gi (or judogi) is the strong jacket and trousers worn for judo. You do not need one for a first trial; wear comfortable training clothes and ask your club about a gi later."
            "compete" -> "Competition is optional. Athletes build confidence through regular coaching and club activities first; your coach will advise when you are ready and explain entry requirements."
            "technique" -> "Beginners learn posture, balance, safe falling and controlled holds before progressing to throws and more advanced techniques. Training is adapted to age and experience."
            "location" -> "WRJA clubs train in the West Rand area. Open the Contact page for the current Golden Score Judo and KJK Judo venue details."
            "coaches" -> "WRJA is supported by qualified instructors and facilitators. See the About page for instructor profiles and club information."
            "parents" -> "Parents and guardians can create and manage an account for a child. Coaches can explain class routines, safety expectations and the best starting group."
            "booking_change" -> "To change or cancel a trial request, contact the club through the Contact page so the training team can assist you."
            "programme" -> "WRJA offers Kids, Adult and Women’s Judo programmes. Choose Kids Judo for young beginners, or Adult/Women’s Judo for older beginners and continuing athletes. Open the Programs page to compare them."
            "trial" -> "You can request a free trial from the Book page. Choose a programme and a preferred session, then submit your request. A club will confirm the available training time."
            "events" -> "Upcoming gradings, competitions and training activities appear on the Events page. Check the page regularly for confirmed dates and details."
            "contact" -> "You can reach the WRJA team from the Contact page, where you can send a message or view the club contact details."
            "schedule" -> "Training times differ by club and programme. Request a free trial from the Book page or use Contact to ask your preferred club for its current timetable."
            "fees" -> "Fees can differ by club and programme. Please use the Contact page to request the current membership and training fee information."
            "ages" -> "Kids Judo is designed for young athletes, while Adult and Women’s Judo welcome older beginners and experienced judoka. A free trial is the best way to find the right group."
            "uniform" -> "Wear comfortable training clothes for a first trial. Your club will explain when a judo gi/uniform is needed and how to obtain one."
            "belts" -> "Belt progress is earned through regular training, skill development and gradings. Your coach will guide you on readiness for the next grade."
            "safety" -> "Safety comes first: coaches teach safe falling, controlled practice and respectful partner work. Tell your coach about any injury or health concern before training."
            "membership" -> "You can start by creating an account and booking a free trial. The club can then guide you through the membership and registration steps."
            "newsletter" -> "You can subscribe on the News page to receive WRJA announcements, results and upcoming event information."
            "greeting" -> "Hello! Ask me about programmes, a free trial, events, or how to contact a club."
            else -> "I can help with programmes, trials, schedules, fees, ages, uniforms, belts, safety, membership, events, newsletters and club contacts."
        }
        AppLanguage.AFRIKAANS -> when (topic) {
            "what_is_judo" -> "Judo is ’n Japannese gevegskuns en Olimpiese sport. Dit leer veilige gooie, penne, fiksheid, dissipline en respek deur beheerde vennootoefening."
            "gi" -> "’n Gi of judogi is die sterk baadjie en broek wat vir judo gedra word. Jy het nie een vir ’n eerste proefsessie nodig nie."
            "compete" -> "Kompetisie is opsioneel. Atlete bou eers vertroue deur gereelde afrigting; jou afrigter sal verduidelik wanneer jy gereed is."
            "technique" -> "Beginners leer houding, balans, veilige valtegnieke en beheerde houe voor meer gevorderde gooie."
            "location" -> "WRJA-klubs oefen in die Wes-Rand. Sien die Kontak-bladsy vir huidige Golden Score Judo- en KJK Judo-venuebesonderhede."
            "coaches" -> "WRJA word deur gekwalifiseerde instrukteurs en fasiliteerders ondersteun. Sien die Oor Ons-bladsy vir profiele."
            "parents" -> "Ouers en voogde kan ’n kind se rekening bestuur. Afrigters kan klasroetines, veiligheid en die regte begingroep verduidelik."
            "booking_change" -> "Gebruik die Kontak-bladsy om ’n proefsessie te verander of te kanselleer sodat die klub kan help."
            "programme" -> "WRJA bied Kinder-, Volwasse- en Vrouejudo-programme. Kies Kinderjudo vir jong beginners, of Volwasse-/Vrouejudo vir ouer beginners en voortgaande atlete. Besoek die Programme-bladsy vir meer."
            "trial" -> "Jy kan ’n gratis proefsessie vanaf die Bespreek-bladsy aanvra. Kies ’n program en voorkeursessie en dien jou versoek in. ’n Klub sal die beskikbare tyd bevestig."
            "events" -> "Komende graderings, kompetisies en oefenaktiwiteite verskyn op die Geleenthede-bladsy. Kyk gereeld vir bevestigde datums en besonderhede."
            "contact" -> "Jy kan die WRJA-span vanaf die Kontak-bladsy bereik, waar jy ’n boodskap kan stuur of klubkontakbesonderhede kan sien."
            "schedule" -> "Oefentye verskil volgens klub en program. Versoek ’n gratis proefsessie op die Bespreek-bladsy of gebruik Kontak om die huidige rooster te vra."
            "fees" -> "Fooie kan volgens klub en program verskil. Gebruik asseblief die Kontak-bladsy vir huidige lidmaatskap- en oefenfooie."
            "ages" -> "Kinderjudo is vir jong atlete; Volwasse- en Vrouejudo verwelkom ouer beginners en ervare judoka. ’n Gratis proefsessie help om die regte groep te vind."
            "uniform" -> "Dra gemaklike oefenklere vir ’n eerste proefsessie. Jou klub sal verduidelik wanneer ’n judogi benodig word."
            "belts" -> "Gordelvordering word deur gereelde oefening, vaardigheidsontwikkeling en graderings verdien. Jou afrigter sal jou gereedheid lei."
            "safety" -> "Veiligheid kom eerste: afrigters leer veilige valtegnieke en beheerde oefening. Vertel jou afrigter van enige besering of gesondheidskwessie."
            "membership" -> "Begin deur ’n rekening te skep en ’n gratis proefsessie te bespreek. Die klub sal jou dan met lidmaatskap en registrasie help."
            "newsletter" -> "Jy kan op die Nuus-bladsy inteken vir WRJA-aankondigings, uitslae en komende geleenthede."
            "greeting" -> "Hallo! Vra my oor programme, ’n gratis proefsessie, geleenthede of klubkontakte."
            else -> "Ek kan help met programme, proefsessies, roosters, fooie, ouderdomme, uniforms, gordels, veiligheid, lidmaatskap, geleenthede, nuusbriewe en klubkontakte."
        }
        AppLanguage.ISIZULU -> when (topic) {
            "what_is_judo" -> "I-judo ubuciko bokulwa baseJapane nomdlalo wama-Olympic. Ifundisa ukuphonsa ngokuphepha, ukubamba, ukuqina, ukuziphatha nenhlonipho."
            "gi" -> "I-gi noma i-judogi yijakhethi nebhulukwe eliqinile lokuqeqesha i-judo. Awuyidingi esivivinyweni sokuqala."
            "compete" -> "Ukuncintisana akuphoqelekile. Abadlali baqala bakhe ukuzethemba ngokuqeqeshwa; umqeqeshi uzokutshela lapho usukulungele khona."
            "technique" -> "Abaqalayo bafunda ukuma, ukulinganisela, ukuwa ngokuphepha nokubamba okulawulwayo ngaphambi kwamasu athuthukile."
            "location" -> "Amaklabhu akwa-WRJA aqeqesha endaweni yase-West Rand. Bheka ikhasi elithi Xhumana ukuze uthole imininingwane yendawo."
            "coaches" -> "I-WRJA isekelwa abafundisi nabaqeqeshi abafanelekile. Bheka ikhasi elithi Mayelana Nathi ukuze ubone amaphrofayela."
            "parents" -> "Abazali noma ababheki bangaphatha i-akhawunti yengane. Abaqeqeshi bangachaza isimiso sekilasi nokuphepha."
            "booking_change" -> "Sebenzisa ikhasi elithi Xhumana ukuze ushintshe noma ukhansele isicelo sesivivinyo."
            "programme" -> "I-WRJA inezinhlelo ze-Kids Judo, Adult Judo ne-Women’s Judo. Vula ikhasi lezinhlelo ukuze uqhathanise ukuthi yiluphi uhlelo olufanele wena."
            "trial" -> "Ungacela isivivinyo samahhala ekhasini elithi Bhukha. Khetha uhlelo nesikhathi osithandayo, bese uthumela isicelo sakho. Iklabhu izoqinisekisa isikhathi esikhona."
            "events" -> "Amagrading, imincintiswano nemisebenzi yokuqeqesha ezayo kuvela ekhasini lemicimbi. Hlola njalo ukuze uthole izinsuku eziqinisekisiwe."
            "contact" -> "Ungathinta ithimba lakwa-WRJA ekhasini elithi Xhumana, lapho ungathumela khona umlayezo noma ubone imininingwane yeklabhu."
            "schedule" -> "Izikhathi zokuqeqesha ziyahluka ngeklabhu nangohlelo. Cela isivivinyo samahhala ekhasini elithi Bhukha noma usebenzise u-Xhumana ubuze uhlelo lwamanje."
            "fees" -> "Izimali ziyahlukahluka ngeklabhu nangohlelo. Sicela usebenzise ikhasi elithi Xhumana ukuze ucele imininingwane yezimali zamanje."
            "ages" -> "I-Kids Judo eyabantwana; i-Adult ne-Women’s Judo yamukela abaqalayo abadala nama-judoka anolwazi. Isivivinyo samahhala sikusiza uthole iqembu elifanele."
            "uniform" -> "Gqoka izingubo zokuzivocavoca ezikhululekile esivivinyweni sokuqala. Iklabhu yakho izochaza ukuthi i-judogi idingeka nini."
            "belts" -> "Ukuqhubeka kwebhande kutholwa ngokuqeqeshwa njalo, ukuthuthukisa amakhono nama-grading. Umqeqeshi wakho uzokuqondisa."
            "safety" -> "Ukuphepha kuqala: abaqeqeshi bafundisa ukuwa ngokuphepha nokuzijwayeza okulawulwayo. Tshela umqeqeshi nganoma yikuphi ukulimala noma ukukhathazeka ngempilo."
            "membership" -> "Qala ngokwakha i-akhawunti bese ubhukha isivivinyo samahhala. Iklabhu izokusiza ngezinyathelo zobulungu nokubhalisa."
            "newsletter" -> "Ungabhalisela ekhasini Lezindaba ukuze uthole izimemezelo zakwa-WRJA, imiphumela nolwazi lwemicimbi ezayo."
            "greeting" -> "Sawubona! Ngibuze ngezinhlelo, isivivinyo samahhala, imicimbi noma indlela yokuxhumana neklabhu."
            else -> "Ngingasiza ngezinhlelo, izivivinyo, izikhathi, izimali, iminyaka, umfaniswano, amabhande, ukuphepha, ubulungu, imicimbi, izindaba nokuxhumana neklabhu."
        }
    }
}

class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(
            ComposeView(this).apply {
                setContent { MaterialTheme(colorScheme = WRJAColorScheme) { WRJAApp() } }
            }
        )
    }
}

@Composable private fun WRJAApp() {
    val activity = LocalActivity.current as? MainActivity
    val context = LocalContext.current.applicationContext
    var language by remember { mutableStateOf(LanguageStore.read(context)) }
    var sessionChecked by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        SupabaseAuth.initialize(context)
        sessionChecked = true
    }

    if (!sessionChecked) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
        return
    }
    val scope = rememberCoroutineScope()

    CompositionLocalProvider(LocalAppLanguage provides language) {
    if (!SupabaseAuth.isLoggedIn) {
        SupabaseAuthScreen(
            onLanguageChanged = { selected ->
                language = selected
                LanguageStore.save(context, selected)
            },
            onFingerprintUnlock = { onError ->
                if (activity != null) {
                    activity.requestFingerprintUnlock(onError)
                } else {
                    onError("Fingerprint recognition is unavailable in this app session.")
                }
            }
        )
    } else {
        var screen by remember { mutableStateOf("home") }
        var loggingOut by remember { mutableStateOf(false) }
        var logoutError by remember { mutableStateOf<String?>(null) }

        MainSite(
            initial = screen,
            logout = {
                if (!loggingOut) {
                    loggingOut = true
                    logoutError = null

                    scope.launch {
                        try {
                            SupabaseAuth.logout()
                        } catch (
                            cancelled: kotlinx.coroutines.CancellationException
                        ) {
                            throw cancelled
                        } catch (failure: Exception) {
                            logoutError =
                                "Could not log out. Check your connection " +
                                        "and try again."
                        } finally {
                            loggingOut = false
                        }
                    }
                }
            },
            update = { screen = it }
        )

        if (loggingOut) {
            AlertDialog(
                onDismissRequest = {},
                title = { Text("Logging out") },
                text = { CircularProgressIndicator() },
                confirmButton = {}
            )
        }

        logoutError?.let { message ->
            AlertDialog(
                onDismissRequest = { logoutError = null },
                title = { Text("Logout failed") },
                text = { Text(message) },
                confirmButton = {
                    TextButton(
                        onClick = { logoutError = null }
                    ) {
                        Text("OK")
                    }
                }
            )
        }
    }
    }
}

private fun MainActivity.requestFingerprintUnlock(onError: (String) -> Unit) {
    val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG
    val fingerprint = getSystemService(FingerprintManager::class.java)
    if (fingerprint == null || !fingerprint.isHardwareDetected) {
        onError("Fingerprint recognition is not available on this device.")
        return
    }
    if (!fingerprint.hasEnrolledFingerprints()) {
        onError("No fingerprint is enrolled on this device. Add one in Android Settings first.")
        return
    }
    when (BiometricManager.from(this).canAuthenticate(authenticators)) {
        BiometricManager.BIOMETRIC_SUCCESS -> Unit
        BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
            onError("No fingerprint is enrolled on this device. Add one in Android Settings first.")
            return
        }
        BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
            onError("Fingerprint recognition is not available on this device.")
            return
        }
        else -> {
            onError("Fingerprint recognition is currently unavailable. Please use your password.")
            return
        }
    }

    val prompt = BiometricPrompt(this, ContextCompat.getMainExecutor(this),
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                lifecycleScope.launch {
                    runCatching { SupabaseAuth.unlockRememberedSession() }
                        .onFailure { onError("Your remembered session is no longer available. Please log in with your password.") }
                }
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                if (errorCode != BiometricPrompt.ERROR_USER_CANCELED &&
                    errorCode != BiometricPrompt.ERROR_NEGATIVE_BUTTON
                ) onError(errString.toString())
            }
        }
    )
    prompt.authenticate(
        BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock WRJA")
            .setSubtitle("Use your fingerprint to continue")
            .setAllowedAuthenticators(authenticators)
            .build()
    )
}

@Composable private fun Logo() = Box(Modifier.size(58.dp).background(Charcoal2), contentAlignment = Alignment.Center) { Image(painterResource(R.drawable.wrja_logo), "West Rand Judo Association logo", Modifier.padding(5.dp).fillMaxSize(), contentScale = ContentScale.Fit) }
@Composable private fun LanguageSelector(onLanguageChanged: (AppLanguage) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val language = LocalAppLanguage.current
    Box(Modifier.fillMaxWidth()) {
        OutlinedButton(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldDark)) {
            Text("${tr("change_language")}: ${language.label}", fontSize = 13.sp)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            AppLanguage.entries.forEach { option ->
                DropdownMenuItem(text = { Text(option.label) }, onClick = { onLanguageChanged(option); expanded = false })
            }
        }
    }
}
@Composable private fun Header(title: String) = Box(Modifier.fillMaxWidth().height(176.dp).background(Charcoal), contentAlignment = Alignment.Center) {
    Image(painterResource(R.drawable.judo_hero), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
    Box(Modifier.fillMaxSize().background(Color(0x99000000)))
    Column(horizontalAlignment = Alignment.CenterHorizontally) { Text(title.uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 30.sp); Text("WEST RAND JUDO ASSOCIATION", color = Gold, fontSize = 11.sp, letterSpacing = 1.sp) }
}

@Composable
internal fun LoginScreen(
    signUp: () -> Unit,
    initialEmail: String = "",
    notice: String? = null,
    onLanguageChanged: (AppLanguage) -> Unit = {},
    onFingerprintUnlock: (((String) -> Unit) -> Unit)? = null
) {
    var email by rememberSaveable(initialEmail) {
        mutableStateOf(initialEmail)
    }
    var rememberMe by rememberSaveable { mutableStateOf(false) }
    var password by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(OffWhite),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            Header(tr("login"))
            Spacer(Modifier.height(32.dp))
        }

        item {
            Card(
                modifier = Modifier.padding(24.dp).fillMaxWidth(),
                elevation = CardDefaults.cardElevation(10.dp)
            ) {
                Column(
                    modifier = Modifier.padding(28.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    LanguageSelector(onLanguageChanged)
                    Spacer(Modifier.height(16.dp))
                    Logo()

                    Spacer(Modifier.height(18.dp))

                    Text(
                        tr("welcome_back"),
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        tr("login_intro"),
                        color = Muted,
                        textAlign = TextAlign.Center,
                        fontSize = 14.sp
                    )

                    Spacer(Modifier.height(24.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text(tr("email")) },
                        placeholder = { Text("you@example.com") },
                        singleLine = true,
                        enabled = !busy,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(Modifier.height(14.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text(tr("password")) },
                        placeholder = { Text(tr("your_password")) },
                        singleLine = true,
                        enabled = !busy,
                        visualTransformation =
                            androidx.compose.ui.text.input
                                .PasswordVisualTransformation(),
                        keyboardOptions =
                            androidx.compose.foundation.text.KeyboardOptions(
                                keyboardType =
                                    androidx.compose.ui.text.input
                                        .KeyboardType.Password
                            ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(40.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(20.dp)
                                    .border(1.dp, if (rememberMe) Gold else Muted)
                                    .background(if (rememberMe) Gold else Color.Transparent)
                                    .clickable(enabled = !busy) { rememberMe = !rememberMe },
                                contentAlignment = Alignment.Center
                            ) {
                                if (rememberMe) Text("✓", color = Ink, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            Spacer(Modifier.width(8.dp))
                            Column {
                                Text(tr("remember_me"), fontSize = 13.sp)
                                Text(
                                    tr("fingerprint_unlock"),
                                    color = Muted,
                                    fontSize = 10.sp,
                                    lineHeight = 12.sp
                                )
                            }
                        }

                        Text(
                            tr("forgot_password"),
                            color = GoldDark,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    notice?.let {
                        Text(
                            it,
                            color = Muted,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )

                        Spacer(Modifier.height(12.dp))
                    }

                    error?.let {
                        Text(
                            it,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )

                        Spacer(Modifier.height(12.dp))
                    }

                    if (SupabaseAuth.hasRememberedSession) {
                        OutlinedButton(
                            onClick = {
                                onFingerprintUnlock?.invoke { message ->
                                    error = message
                                }
                            },
                            enabled = !busy,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = GoldDark)
                        ) { Text("USE FINGERPRINT", fontWeight = FontWeight.Bold) }
                        Spacer(Modifier.height(8.dp))
                    }

                    Button(
                        onClick = {
                            error = null

                            if (email.isBlank() || password.isBlank()) {
                                error = "Enter your email and password."
                            } else {
                                busy = true

                                scope.launch {
                                    try {
                                        SupabaseAuth.login(
                                            email = email,
                                            password = password,
                                            rememberMe = rememberMe
                                        )
                                    } catch (
                                        cancelled:
                                        kotlinx.coroutines.CancellationException
                                    ) {
                                        throw cancelled
                                    } catch (failure: Exception) {
                                        error =
                                            if (failure is java.io.IOException) {
                                                "Could not connect. " +
                                                        "Check your connection."
                                            } else {
                                                failure.message
                                                    ?: "Login failed."
                                            }
                                    } finally {
                                        busy = false
                                    }
                                }
                            }
                        },
                        enabled = !busy,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Gold,
                            contentColor = Ink
                        )
                    ) {
                        if (busy) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Ink,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                tr("login").uppercase(),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(Modifier.height(10.dp))

                    Text(
                        tr("dont_have_account"),
                        modifier = Modifier.clickable(
                            enabled = !busy,
                            onClick = signUp
                        ),
                        color = GoldDark,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
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
    var page by rememberSaveable { mutableStateOf(initial) }; val drawer = rememberDrawerState(DrawerValue.Closed); val scope = rememberCoroutineScope(); val pages = listOf("home" to tr("home"), "my profile" to tr("my_profile"), "about" to tr("about"), "events" to tr("events"), "programs" to tr("programs"), "book" to tr("book"), "news" to tr("news"), "gallery" to tr("gallery"), "contact" to tr("contact"), "chat assistant" to tr("chat_assistant"))
    ModalNavigationDrawer(drawerState = drawer, drawerContent = { ModalDrawerSheet { Column(
        Modifier
            .fillMaxHeight()
            .background(Charcoal)
            .verticalScroll(rememberScrollState())
    ) { Row(Modifier.padding(22.dp), verticalAlignment = Alignment.CenterVertically) { Logo(); Spacer(Modifier.width(12.dp)); Text("WEST RAND\nJUDO ASSOCIATION", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) }; pages.forEach { (route, label) -> Text(label, Modifier.fillMaxWidth().clickable { page = route; update(page); scope.launch { drawer.close() } }.padding(18.dp), color = if (route == page) Gold else Color.White, fontWeight = FontWeight.SemiBold) }; Spacer(Modifier.height(24.dp)); Text(tr("log_out").uppercase(), Modifier.clickable { logout() }.padding(22.dp), color = Gold, fontWeight = FontWeight.Bold) } } }) {
        Scaffold(topBar = { TopAppBar(title = { Text("WEST RAND JUDO", fontWeight = FontWeight.Black, fontSize = 16.sp) }, navigationIcon = { IconButton({ scope.launch { drawer.open() } }) { Icon(Icons.Default.Menu, "Menu") } }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Charcoal, titleContentColor = Color.White, navigationIconContentColor = Color.White)) }) { padding -> AnimatedContent(targetState = page, transitionSpec = { (slideInHorizontally { it / 9 } + fadeIn()) togetherWith (slideOutHorizontally { -it / 9 } + fadeOut()) }, label = "site page transition") { targetPage -> SitePage(targetPage, Modifier.padding(padding)) } }
    }
}

@Composable private fun SitePage(page: String, modifier: Modifier) {
    val descriptions = mapOf("home" to "Building discipline, respect, and excellence through judo for athletes of all ages across the West Rand community.", "about" to "Building character on and off the mat. We develop confident, disciplined and respectful individuals through judo.", "events" to "Club gradings, competitions and training activities.", "programs" to "Judo programmes for children and adults at every level.","book" to "Choose your program and preferred training session.", "news" to "Competition results and achievements from WRJA athletes.", "gallery" to "Training, competition and community moments.", "contact" to "Send us a message or contact our training venues.", "chat assistant" to "Your WRJA guide for training, programmes, events and club information.")
    val title = when (page) { "home" -> tr("home"); "my profile" -> tr("my_profile"); "about" -> tr("about"); "events" -> tr("events"); "programs" -> tr("programs"); "book" -> tr("book"); "news" -> tr("news"); "gallery" -> tr("gallery"); "contact" -> tr("contact"); "chat assistant" -> tr("chat_assistant"); else -> page.replaceFirstChar { it.uppercase() } }
    LazyColumn(modifier.fillMaxSize().background(Charcoal)) { item { Box(Modifier.fillMaxWidth().height(if (page == "home") 320.dp else 160.dp).background(Charcoal2), contentAlignment = if (page == "home") Alignment.BottomStart else Alignment.Center) { if (page == "home") { Image(painterResource(R.drawable.landing_1), "WRJA members training together", Modifier.fillMaxSize(), contentScale = ContentScale.Crop); Box(Modifier.fillMaxSize().background(Color(0x88000000))) }; Column(Modifier.padding(28.dp), horizontalAlignment = if (page == "home") Alignment.Start else Alignment.CenterHorizontally) { Text(if (page == "home") "WELCOME TO\nWEST RAND JUDO\nASSOCIATION" else title.uppercase(), color = Color.White, fontSize = if (page == "home") 29.sp else 30.sp, fontWeight = FontWeight.Bold); Text(if (page == "home") "DISCIPLINE  •  RESPECT  •  EXCELLENCE" else "HOME  /  $title", color = Gold, fontSize = 11.sp, letterSpacing = 1.sp) } } }; item { Column(Modifier.padding(24.dp)) { Text(if (page == "chat assistant") tr("chat_help") else descriptions[page] ?: "", color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 19.sp, lineHeight = 28.sp); Spacer(Modifier.height(20.dp)); when (page) {"my profile" -> SupabaseMemberProfile();"book" -> BookScreen();"contact" -> { ContactForm(); Spacer(Modifier.height(28.dp)); WebsiteContact() }; "chat assistant" -> ChatAssistantScreen(); else -> ContentCards(page) } } } }
}

@Composable private fun ContentCards(page: String) {

    if (page == "home") {
        WebsiteHome()
        return
    }
    if (page == "programs") {
        WebsitePrograms()
        return
    }
    if (page == "events") {
        var showPayments by rememberSaveable { mutableStateOf(false) }
        if (showPayments) {
            EftPaymentsScreen(onBack = { showPayments = false })
        } else {
            WebsiteEventsHub(onCompetitionsClick = { showPayments = true })
            Spacer(Modifier.height(24.dp))
            EventsCalendarPreview()
            Spacer(Modifier.height(24.dp))
            SupabaseEvents()
        }
        return
    }
    if (page == "news") {
        WebsiteNews()
        return
    }
    if (page == "about") {
        WebsiteAbout()
        return
    }
    if (page == "gallery") {
        WebsiteGallery()
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

@Composable
private fun EventsCalendarPreview() {
    Spacer(Modifier.height(16.dp))
    Text(
        text = "AUGUST 2026",
        fontSize = 22.sp,
        fontWeight = FontWeight.Bold,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth()
    )
    Spacer(Modifier.height(12.dp))

    // Keep the existing preview month. Every row must contain seven cells.
    val days = List(5) { "" } + (1..31).map { it.toString() }
    val trailingBlanks = (7 - days.size % 7) % 7
    val cells = days + List(trailingBlanks) { "" }

    Column(Modifier.fillMaxWidth().background(OffWhite)) {
        Row(Modifier.fillMaxWidth().background(GoldDark)) {
            listOf("M", "T", "W", "T", "F", "S", "S").forEach { label ->
                Text(
                    text = label,
                    modifier = Modifier.weight(1f).padding(vertical = 10.dp),
                    textAlign = TextAlign.Center,
                    color = Charcoal,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        cells.chunked(7).forEach { week ->
            Row(Modifier.fillMaxWidth()) {
                week.forEach { day ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .padding(1.dp)
                            .background(if (day == "12") Gold else Color.White),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = day,
                            color = Charcoal,
                            fontSize = 13.sp,
                            fontWeight = if (day == "12") FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
    Spacer(Modifier.height(14.dp))
    Text(
        text = "Calendar preview only. For EFT payments, use the Competitions card above.",
        color = Muted,
        fontSize = 13.sp,
        lineHeight = 19.sp
    )
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
    val language = LocalAppLanguage.current
    val welcome = tr("chat_welcome")
    val help = tr("chat_help")
    val messages = remember(language, welcome, help) {
        mutableStateListOf(
            ChatMessageUi(welcome, true),
            ChatMessageUi(help, true)
        )
    }
    var draft by rememberSaveable { mutableStateOf("") }
    val sendMessage = {
        val question = draft.trim()
        if (question.isNotEmpty()) {
            messages += ChatMessageUi(question, false)
            messages += ChatMessageUi(localChatReply(question, language), true)
            draft = ""
        }
    }

    Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Charcoal)) {
        Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(44.dp).background(Gold), contentAlignment = Alignment.Center) { Text("WR", color = Ink, fontWeight = FontWeight.Black, fontSize = 14.sp) }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(tr("wrja_assistant"), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(tr("online_when_connected"), color = Gold, fontSize = 12.sp)
            }
        }
    }
    Spacer(Modifier.height(16.dp))
    messages.forEach { message -> ChatBubble(message) }
    Spacer(Modifier.height(12.dp))
    Text(tr("suggested_questions"), color = GoldDark, fontWeight = FontWeight.Bold, fontSize = 11.sp, letterSpacing = 0.7.sp)
    Spacer(Modifier.height(8.dp))
    listOf(tr("question_programme"), tr("question_trial"), tr("question_events")).forEach { suggestion ->
        AssistChip(onClick = {
            messages += ChatMessageUi(suggestion, false)
            messages += ChatMessageUi(localChatReply(suggestion, language), true)
        }, label = { Text(suggestion, fontSize = 12.sp) }, colors = AssistChipDefaults.assistChipColors(containerColor = OffWhite, labelColor = Ink), modifier = Modifier.padding(end = 6.dp, bottom = 6.dp))
    }
    Spacer(Modifier.height(14.dp))
    Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = OffWhite)) {
        Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(value = draft, onValueChange = { draft = it }, placeholder = { Text(tr("ask_assistant")) }, modifier = Modifier.weight(1f), singleLine = true, colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Gold, unfocusedBorderColor = Color.LightGray))
            Spacer(Modifier.width(8.dp))
            IconButton(onClick = sendMessage, enabled = draft.isNotBlank(), colors = IconButtonDefaults.iconButtonColors(contentColor = Ink, disabledContentColor = Muted)) { Icon(Icons.Default.Send, "Send message") }
        }
    }
    Text(tr("chat_preview"), color = Muted, fontSize = 11.sp, lineHeight = 16.sp, modifier = Modifier.padding(top = 10.dp))
}

@Composable private fun ChatBubble(message: ChatMessageUi) {
    Row(Modifier.fillMaxWidth().padding(bottom = 10.dp), horizontalArrangement = if (message.fromAssistant) Arrangement.Start else Arrangement.End) {
        Surface(color = if (message.fromAssistant) OffWhite else Gold, shape = MaterialTheme.shapes.medium, tonalElevation = 1.dp) {
            Text(message.text, Modifier.padding(horizontal = 15.dp, vertical = 12.dp).widthIn(max = 265.dp), color = Ink, fontSize = 14.sp, lineHeight = 20.sp)
        }
    }
}
