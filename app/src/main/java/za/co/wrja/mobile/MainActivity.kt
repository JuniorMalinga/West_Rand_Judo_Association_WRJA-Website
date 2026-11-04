package za.co.wrja.mobile

import android.os.Bundle
import android.hardware.fingerprint.FingerprintManager
import androidx.activity.compose.LocalActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.selection.toggleable
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
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ComposeView
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Shapes
import androidx.compose.ui.graphics.Brush
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
    primaryContainer = Color(0xFF403000),
    onPrimaryContainer = Color(0xFFFFE08A),
    secondary = Color(0xFFFFDA69),
    onSecondary = Charcoal,
    secondaryContainer = Color(0xFF403000),
    onSecondaryContainer = Color(0xFFFFE08A),
    background = Charcoal,
    onBackground = Ink,
    surface = Charcoal2,
    onSurface = Ink,
    surfaceVariant = Color(0xFF242424),
    onSurfaceVariant = Muted,
    outline = Color(0xFF5C5C5C)
)
private val WRJAShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(26.dp),
    extraLarge = RoundedCornerShape(32.dp)
)

/** Conversation model; a remote chat service can use this same shape later. */
private data class ChatMessageUi(val text: String, val fromAssistant: Boolean)
private class ChatConversation {
    val messages = mutableStateListOf<ChatMessageUi>()
    val onlineExchanges = ArrayDeque<WebsiteChatExchange>()
    var draft by mutableStateOf("")
    var sending by mutableStateOf(false)
}

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
        listOf("program", "programme", "uhlelo").any(query::contains) -> "programme"
        mentionsRetiredTrainingFlow(query) || listOf("get started", "begin ek", "ngingaqala").any(query::contains) -> "getting_started"
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
            "gi" -> "A gi (or judogi) is the strong jacket and trousers worn for judo. You do not need one for a first class; wear comfortable training clothes and ask your club about a gi later."
            "compete" -> "Competition is optional. Athletes build confidence through regular coaching and club activities first; your coach will advise when you are ready and explain entry requirements."
            "technique" -> "Beginners learn posture, balance, safe falling and controlled holds before progressing to throws and more advanced techniques. Training is adapted to age and experience."
            "location" -> "WRJA clubs train in the West Rand area. Open the Contact page for the current Golden Score Judo and KJK Judo venue details."
            "coaches" -> "WRJA is supported by qualified instructors and facilitators. See the About page for instructor profiles and club information."
            "parents" -> "Parents and guardians can create and manage an account for a child. Coaches can explain class routines, safety expectations and the best starting group."
            "programme" -> "WRJA offers Kids, Adult and Women’s Judo programmes. Choose Kids Judo for young beginners, or Adult/Women’s Judo for older beginners and continuing athletes. Open the Programs page to compare them."
            "getting_started" -> "Use the Contact page to ask WRJA about joining a class or trying judo. The club can confirm availability and explain how to get started."
            "events" -> "Upcoming gradings, competitions and training activities appear on the Events page. Check the page regularly for confirmed dates and details."
            "contact" -> "You can reach the WRJA team from the Contact page, where you can send a message or view the club contact details."
            "schedule" -> "Training times differ by club and programme. Use Contact to ask your preferred club for its current timetable."
            "fees" -> "Fees can differ by club and programme. Please use the Contact page to request the current membership and training fee information."
            "ages" -> "Kids Judo is designed for young athletes, while Adult and Women’s Judo welcome older beginners and experienced judoka. Contact WRJA to find the right group."
            "uniform" -> "Wear comfortable training clothes for a first class. Your club will explain when a judo gi/uniform is needed and how to obtain one."
            "belts" -> "Belt progress is earned through regular training, skill development and gradings. Your coach will guide you on readiness for the next grade."
            "safety" -> "Safety comes first: coaches teach safe falling, controlled practice and respectful partner work. Tell your coach about any injury or health concern before training."
            "membership" -> "Contact WRJA for help with membership, registration, and choosing a class."
            "newsletter" -> "The app does not offer newsletter signup. Enable club notifications in the menu or contact WRJA about email updates."
            "greeting" -> "Hello! Ask me about programmes, getting started, events, or how to contact a club."
            else -> "I can help with programmes, getting started, schedules, fees, ages, uniforms, belts, safety, membership, events, newsletters and club contacts."
        }
        AppLanguage.AFRIKAANS -> when (topic) {
            "what_is_judo" -> "Judo is ’n Japannese gevegskuns en Olimpiese sport. Dit leer veilige gooie, penne, fiksheid, dissipline en respek deur beheerde vennootoefening."
            "gi" -> "’n Gi of judogi is die sterk baadjie en broek wat vir judo gedra word. Jy het nie een vir ’n eerste klas nodig nie."
            "compete" -> "Kompetisie is opsioneel. Atlete bou eers vertroue deur gereelde afrigting; jou afrigter sal verduidelik wanneer jy gereed is."
            "technique" -> "Beginners leer houding, balans, veilige valtegnieke en beheerde houe voor meer gevorderde gooie."
            "location" -> "WRJA-klubs oefen in die Wes-Rand. Sien die Kontak-bladsy vir huidige Golden Score Judo- en KJK Judo-venuebesonderhede."
            "coaches" -> "WRJA word deur gekwalifiseerde instrukteurs en fasiliteerders ondersteun. Sien die Oor Ons-bladsy vir profiele."
            "parents" -> "Ouers en voogde kan ’n kind se rekening bestuur. Afrigters kan klasroetines, veiligheid en die regte begingroep verduidelik."
            "programme" -> "WRJA bied Kinder-, Volwasse- en Vrouejudo-programme. Kies Kinderjudo vir jong beginners, of Volwasse-/Vrouejudo vir ouer beginners en voortgaande atlete. Besoek die Programme-bladsy vir meer."
            "getting_started" -> "Gebruik die Kontak-bladsy om WRJA te vra hoe jy met judo kan begin. Die klub kan beskikbaarheid bevestig."
            "events" -> "Komende graderings, kompetisies en oefenaktiwiteite verskyn op die Geleenthede-bladsy. Kyk gereeld vir bevestigde datums en besonderhede."
            "contact" -> "Jy kan die WRJA-span vanaf die Kontak-bladsy bereik, waar jy ’n boodskap kan stuur of klubkontakbesonderhede kan sien."
            "schedule" -> "Oefentye verskil volgens klub en program. Gebruik Kontak om jou klub se huidige rooster te vra."
            "fees" -> "Fooie kan volgens klub en program verskil. Gebruik asseblief die Kontak-bladsy vir huidige lidmaatskap- en oefenfooie."
            "ages" -> "Kinderjudo is vir jong atlete; Volwasse- en Vrouejudo verwelkom ouer beginners en ervare judoka. Kontak WRJA om die regte groep te vind."
            "uniform" -> "Dra gemaklike oefenklere vir ’n eerste klas. Jou klub sal verduidelik wanneer ’n judogi benodig word."
            "belts" -> "Gordelvordering word deur gereelde oefening, vaardigheidsontwikkeling en graderings verdien. Jou afrigter sal jou gereedheid lei."
            "safety" -> "Veiligheid kom eerste: afrigters leer veilige valtegnieke en beheerde oefening. Vertel jou afrigter van enige besering of gesondheidskwessie."
            "membership" -> "Kontak WRJA vir hulp met lidmaatskap, registrasie en die keuse van ’n klas."
            "newsletter" -> "Die app bied nie nuusbriefintekening nie. Aktiveer klubkennisgewings in die kieslys of kontak WRJA oor e-posnuus."
            "greeting" -> "Hallo! Vra my oor programme, hoe om te begin, geleenthede of klubkontakte."
            else -> "Ek kan help met programme, hoe om te begin, roosters, fooie, ouderdomme, uniforms, gordels, veiligheid, lidmaatskap, geleenthede, nuusbriewe en klubkontakte."
        }
        AppLanguage.ISIZULU -> when (topic) {
            "what_is_judo" -> "I-judo ubuciko bokulwa baseJapane nomdlalo wama-Olympic. Ifundisa ukuphonsa ngokuphepha, ukubamba, ukuqina, ukuziphatha nenhlonipho."
            "gi" -> "I-gi noma i-judogi yijakhethi nebhulukwe eliqinile lokuqeqesha i-judo. Buza iklabhu yakho ukuthi uyidinga nini."
            "compete" -> "Ukuncintisana akuphoqelekile. Abadlali baqala bakhe ukuzethemba ngokuqeqeshwa; umqeqeshi uzokutshela lapho usukulungele khona."
            "technique" -> "Abaqalayo bafunda ukuma, ukulinganisela, ukuwa ngokuphepha nokubamba okulawulwayo ngaphambi kwamasu athuthukile."
            "location" -> "Amaklabhu akwa-WRJA aqeqesha endaweni yase-West Rand. Bheka ikhasi elithi Xhumana ukuze uthole imininingwane yendawo."
            "coaches" -> "I-WRJA isekelwa abafundisi nabaqeqeshi abafanelekile. Bheka ikhasi elithi Mayelana Nathi ukuze ubone amaphrofayela."
            "parents" -> "Abazali noma ababheki bangaphatha i-akhawunti yengane. Abaqeqeshi bangachaza isimiso sekilasi nokuphepha."
            "programme" -> "I-WRJA inezinhlelo ze-Kids Judo, Adult Judo ne-Women’s Judo. Vula ikhasi lezinhlelo ukuze uqhathanise ukuthi yiluphi uhlelo olufanele wena."
            "getting_started" -> "Sebenzisa ikhasi elithi Xhumana ukuze ubuze i-WRJA ukuthi ungaqala kanjani nge-judo. Iklabhu ingakuqinisekisa ukuthi yiziphi izikhathi ezitholakalayo."
            "events" -> "Amagrading, imincintiswano nemisebenzi yokuqeqesha ezayo kuvela ekhasini lemicimbi. Hlola njalo ukuze uthole izinsuku eziqinisekisiwe."
            "contact" -> "Ungathinta ithimba lakwa-WRJA ekhasini elithi Xhumana, lapho ungathumela khona umlayezo noma ubone imininingwane yeklabhu."
            "schedule" -> "Izikhathi zokuqeqesha ziyahluka ngeklabhu nangohlelo. Sebenzisa u-Xhumana ukuze ubuze iklabhu ngeshejuli yayo yamanje."
            "fees" -> "Izimali ziyahlukahluka ngeklabhu nangohlelo. Sicela usebenzise ikhasi elithi Xhumana ukuze ucele imininingwane yezimali zamanje."
            "ages" -> "I-Kids Judo eyabantwana; i-Adult ne-Women’s Judo yamukela abaqalayo abadala nama-judoka anolwazi. Xhumana ne-WRJA ukuze uthole iqembu elifanele."
            "uniform" -> "Gqoka izingubo zokuzivocavoca ezikhululekile ekilasini lokuqala. Iklabhu yakho izochaza ukuthi i-judogi idingeka nini."
            "belts" -> "Ukuqhubeka kwebhande kutholwa ngokuqeqeshwa njalo, ukuthuthukisa amakhono nama-grading. Umqeqeshi wakho uzokuqondisa."
            "safety" -> "Ukuphepha kuqala: abaqeqeshi bafundisa ukuwa ngokuphepha nokuzijwayeza okulawulwayo. Tshela umqeqeshi nganoma yikuphi ukulimala noma ukukhathazeka ngempilo."
            "membership" -> "Xhumana ne-WRJA ukuze uthole usizo ngobulungu, ukubhalisa nokukhetha ikilasi."
            "newsletter" -> "Uhlelo alunakho ukubhalisela incwadi yezindaba. Vula izaziso zeklabhu kumenyu noma uthinte i-WRJA ngezindaba ze-imeyili."
            "greeting" -> "Sawubona! Ngibuze ngezinhlelo, ukuthi ungaqala kanjani, imicimbi noma indlela yokuxhumana neklabhu."
            else -> "Ngingasiza ngezinhlelo, ukuqala nge-judo, izikhathi, izimali, iminyaka, umfaniswano, amabhande, ukuphepha, ubulungu, imicimbi, izindaba nokuxhumana neklabhu."
        }
    }
}

class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.BLACK)
        )
        setContentView(
            ComposeView(this).apply {
                setContent {
                    MaterialTheme(colorScheme = WRJAColorScheme, shapes = WRJAShapes) {
                        Box(Modifier.fillMaxSize().background(Charcoal).windowInsetsPadding(WindowInsets.safeDrawing.union(WindowInsets.ime))) {
                            WRJAApp()
                        }
                    }
                }
            }
        )
    }
}

@Composable private fun WRJAApp() {
    val activity = LocalActivity.current as? MainActivity
    val context = LocalContext.current.applicationContext
    var language by remember {
        mutableStateOf(try { LanguageStore.read(context) } catch (failure: Exception) {
            reportFailure("Read language preference", failure)
            AppLanguage.ENGLISH
        })
    }
    var sessionChecked by remember { mutableStateOf(false) }
    var startupFailed by remember { mutableStateOf(false) }
    var startupAttempt by remember { mutableStateOf(0) }
    var languageSaveFailed by remember { mutableStateOf(false) }

    LaunchedEffect(startupAttempt) {
        startupFailed = false
        sessionChecked = recoverOperation("Start sign-in", { startupFailed = true; false }) {
            SupabaseAuth.initialize(context)
            true
        }
    }

    if (!sessionChecked) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            if (startupFailed) {
                CompositionLocalProvider(LocalAppLanguage provides language) {
                    Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(localized("Could not start sign-in. Please try again.", "Kon nie aanmelding begin nie. Probeer asseblief weer.", "Ukungena akuqalanga. Sicela uzame futhi."))
                        TextButton(onClick = { startupAttempt++ }) { Text(localized("Retry", "Probeer weer", "Zama futhi")) }
                    }
                }
            } else CircularProgressIndicator()
        }
        return
    }
    val scope = rememberCoroutineScope()
    val changeLanguage: (AppLanguage) -> Unit = { selected ->
        language = selected
        try {
            LanguageStore.save(context, selected)
        } catch (failure: Exception) {
            reportFailure("Save language preference", failure)
            languageSaveFailed = true
        }
    }

    CompositionLocalProvider(LocalAppLanguage provides language) {
    if (languageSaveFailed) {
        AlertDialog(
            onDismissRequest = { languageSaveFailed = false },
            text = { Text(localized("Language changed, but the preference could not be saved for next time.", "Die taal is verander, maar die voorkeur kon nie vir volgende keer gestoor word nie.", "Ulimi lushintshile, kodwa ukukhetha akugcinwanga ukuze kusetshenziswe ngokuzayo.")) },
            confirmButton = { TextButton(onClick = { languageSaveFailed = false }) { Text(localized("Close", "Sluit", "Vala")) } }
        )
    }
    val fingerprintUnavailable = localized("Fingerprint sign-in is unavailable. Please use your password.", "Vingerafdrukaanmelding is onbeskikbaar. Gebruik asseblief jou wagwoord.", "Ukungena ngesigxivizo somunwe akutholakali. Sicela usebenzise iphasiwedi yakho.")
    if (!SupabaseAuth.isLoggedIn) {
        SupabaseAuthScreen(
            onLanguageChanged = changeLanguage,
            onFingerprintUnlock = { onError ->
                try {
                    if (activity != null) activity.requestFingerprintUnlock(onError) else onError(fingerprintUnavailable)
                } catch (failure: Exception) {
                    reportFailure("Open fingerprint prompt", failure)
                    onError(fingerprintUnavailable)
                }
            }
        )
    } else {
        var screen by remember { mutableStateOf("home") }
        var loggingOut by remember { mutableStateOf(false) }
        var logoutError by remember { mutableStateOf<String?>(null) }
        val signOutFailure = localized("Could not finish signing out on this device. Try again before handing over the device.", "Kon nie op hierdie toestel afmeld nie. Probeer weer voordat jy die toestel oorhandig.", "Ukuphuma kule divayisi akuphumelelanga. Zama futhi ngaphambi kokunikeza omunye umuntu idivayisi.")

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
                            logoutError = actionFailure("Sign out", failure, signOutFailure)
                        } finally {
                            loggingOut = false
                        }
                    }
                }
            },
            update = { screen = it },
            onLanguageChanged = changeLanguage
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
                    recoverOperation("Unlock remembered session", {
                        onError("Your remembered session is no longer available. Please log in with your password.")
                    }) { SupabaseAuth.unlockRememberedSession() }
                }
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                if (errorCode != BiometricPrompt.ERROR_CANCELED &&
                    errorCode != BiometricPrompt.ERROR_USER_CANCELED &&
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
            .setNegativeButtonText("Use password")
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
@Composable private fun Header(title: String) = Box(Modifier.fillMaxWidth().heightIn(min = 176.dp).background(Charcoal), contentAlignment = Alignment.Center) {
    Image(painterResource(R.drawable.judo_hero), null, Modifier.matchParentSize(), contentScale = ContentScale.Crop)
    Box(Modifier.matchParentSize().background(Color(0x99000000)))
    Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(title.uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 30.sp, textAlign = TextAlign.Center); Text("WEST RAND JUDO ASSOCIATION", color = Gold, fontSize = 11.sp, letterSpacing = 1.sp, textAlign = TextAlign.Center) }
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
    var showPasswordReset by remember { mutableStateOf(false) }
    var password by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val missingEmailError = localized("Enter your email address.", "Voer jou e-posadres in.", "Faka ikheli lakho le-imeyili.")
    val invalidEmailError = localized("Enter a valid email address.", "Voer 'n geldige e-posadres in.", "Faka ikheli le-imeyili elivumelekile.")
    val missingPasswordError = localized("Enter your password.", "Voer jou wagwoord in.", "Faka iphasiwedi yakho.")
    val connectionError = localized("Could not connect. Check your connection.", "Kon nie koppel nie. Gaan jou verbinding na.", "Ayikwazanga ukuxhuma. Hlola uxhumano lwakho.")
    val loginFailedError = localized("Login failed.", "Aanmelding het misluk.", "Ukungena kwehlulekile.")
    val displayAuthFailure = authFailureMessage(connectionError, loginFailedError)

    if (showPasswordReset) {
        PasswordResetDialog(initialEmail = email, onDismiss = {
            showPasswordReset = false
            password = ""
            error = null
        })
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(OffWhite),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item { Header(tr("login")); Spacer(Modifier.height(16.dp)) }

        item {
            Card(
                modifier = Modifier.widthIn(max = 560.dp).fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Charcoal2),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF3A3A3A)),
                elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    LanguageSelector(onLanguageChanged)
                    Spacer(Modifier.height(14.dp))
                    Logo()

                    Spacer(Modifier.height(14.dp))

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

                    Spacer(Modifier.height(20.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = boundedInput(email, it, InputLimits.EMAIL); error = null },
                        label = { Text(tr("email")) },
                        placeholder = { Text("you@example.com") },
                        singleLine = true,
                        enabled = !busy,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = boundedInput(password, it, InputLimits.LOGIN_PASSWORD); error = null },
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

                    Spacer(Modifier.height(2.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                            .toggleable(value = rememberMe, enabled = !busy, role = Role.Checkbox, onValueChange = { rememberMe = it }),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                            Box(
                                modifier = Modifier
                                    .size(20.dp)
                                    .border(1.dp, if (rememberMe) Gold else Muted)
                                    .background(if (rememberMe) Gold else Color.Transparent),
                                contentAlignment = Alignment.Center
                            ) {
                                if (rememberMe) Text("✓", color = Ink, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            Spacer(Modifier.width(8.dp))
                            Column(Modifier.weight(1f)) {
                                Text(tr("remember_me"), fontSize = 13.sp)
                                Text(
                                    tr("fingerprint_unlock"),
                                    color = Muted,
                                    fontSize = 10.sp,
                                    lineHeight = 13.sp
                                )
                            }
                    }
                    TextButton(onClick = { showPasswordReset = true }, enabled = !busy, modifier = Modifier.align(Alignment.End)) {
                        Text(tr("forgot_password"), color = GoldDark, fontSize = 13.sp, fontWeight = FontWeight.Bold)
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
                        ) { Text(localized("USE FINGERPRINT", "GEBRUIK VINGERAFDRUK", "SEBENZISA ISIGXIVIZO SOMUNWE"), fontWeight = FontWeight.Bold) }
                        Spacer(Modifier.height(10.dp))
                    }

                    Button(
                        onClick = {
                            error = null

                            if (email.isBlank()) {
                                error = missingEmailError
                            } else if (!isValidEmailAddress(email)) {
                                error = invalidEmailError
                            } else if (password.isBlank()) {
                                error = missingPasswordError
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
                                        error = displayAuthFailure(failure)
                                    } finally {
                                        busy = false
                                    }
                                }
                            }
                        },
                        enabled = !busy,
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 52.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Gold,
                            contentColor = Charcoal
                        )
                    ) {
                        if (busy) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Charcoal,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                tr("login").uppercase(),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(Modifier.height(14.dp))

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
@Composable private fun MainSite(
    initial: String,
    logout: () -> Unit,
    update: (String) -> Unit,
    onLanguageChanged: (AppLanguage) -> Unit
) {
    var page by rememberSaveable { mutableStateOf(initial) }
    var history by rememberSaveable { mutableStateOf(arrayListOf<String>()) }
    LaunchedEffect(Unit) {
        if (page == "book") {
            page = "contact"
            update(page)
        }
        if ("book" in history) history = ArrayList(history.filterNot { it == "book" })
    }
    val screenState = androidx.compose.runtime.saveable.rememberSaveableStateHolder()
    val chat = remember { ChatConversation() }
    val drawer = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var navigationFailed by remember { mutableStateOf(false) }
    fun moveMenu(open: Boolean) {
        scope.launch {
            recoverOperation("Move navigation menu", { navigationFailed = true }) {
                if (open) drawer.open() else drawer.close()
            }
        }
    }
    if (navigationFailed) {
        AlertDialog(
            onDismissRequest = { navigationFailed = false },
            text = { Text(localized("The menu could not respond. Close this message and try again.", "Die kieslys kon nie reageer nie. Sluit hierdie boodskap en probeer weer.", "Imenyu ayiphendulanga. Vala lo mlayezo bese uzama futhi.")) },
            confirmButton = { TextButton(onClick = { navigationFailed = false }) { Text(localized("Close", "Sluit", "Vala")) } }
        )
    }
    fun navigate(destination: String) {
        if (destination != page) {
            history = ArrayList((history + page).takeLast(50))
            page = destination
            update(destination)
        }
    }
    androidx.activity.compose.BackHandler(enabled = drawer.isOpen || history.isNotEmpty()) {
        if (drawer.isOpen) moveMenu(false)
        else {
            page = history.lastOrNull() ?: return@BackHandler
            history = ArrayList(history.dropLast(1))
            update(page)
        }
    }
    val pages = listOf("home" to tr("home"), "my profile" to tr("my_profile"), "about" to tr("about"), "events" to tr("events"), "programs" to tr("programs"), "news" to tr("news"), "gallery" to tr("gallery"), "faq" to tr("faq"), "contact" to tr("contact"), "chat assistant" to tr("chat_assistant"))
    ModalNavigationDrawer(
        drawerState = drawer,
        drawerContent = {
            ModalDrawerSheet(drawerContainerColor = Charcoal2, drawerContentColor = Ink) {
                Column(Modifier.fillMaxHeight().verticalScroll(rememberScrollState()).padding(vertical = 12.dp)) {
                    Row(Modifier.padding(horizontal = 22.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Surface(color = Color(0xFF242424), shape = RoundedCornerShape(16.dp)) { Box(Modifier.padding(8.dp)) { Logo() } }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) { Text("WEST RAND", color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp); Text("JUDO ASSOCIATION", color = Gold, fontWeight = FontWeight.Bold, fontSize = 10.sp, letterSpacing = 1.sp) }
                    }
                    HorizontalDivider(color = Color(0xFF343434), modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp))
                    pages.forEach { (route, label) ->
                        val selected = route == page.substringBefore('/')
                        NavigationDrawerItem(
                            label = { Text(label, fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium) },
                            selected = selected,
                            onClick = { navigate(route); moveMenu(false) },
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 2.dp),
                            colors = NavigationDrawerItemDefaults.colors(
                                selectedContainerColor = Color(0xFF443400),
                                selectedTextColor = Gold,
                                unselectedTextColor = Ink
                            )
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    HorizontalDivider(color = Color(0xFF343434), modifier = Modifier.padding(horizontal = 16.dp))
                    Text(
                        tr("change_language").uppercase(),
                        modifier = Modifier.padding(start = 22.dp, top = 18.dp, bottom = 8.dp),
                        color = Gold,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                    Box(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                        LanguageSelector(onLanguageChanged)
                    }
                    Spacer(Modifier.height(16.dp))
                    HorizontalDivider(color = Color(0xFF343434), modifier = Modifier.padding(horizontal = 16.dp))
                    PushNotificationSettings()
                    Text(tr("log_out").uppercase(), Modifier.fillMaxWidth().clickable { logout() }.padding(22.dp), color = Gold, fontWeight = FontWeight.Bold)
                }
            }
        }
    ) {
        Scaffold(
            contentWindowInsets = WindowInsets(0, 0, 0, 0),
            topBar = {
                Surface(color = Charcoal, contentColor = Color.White) {
                    Row(Modifier.fillMaxWidth().heightIn(min = 56.dp).padding(end = 16.dp, top = 4.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                        IconButton({ moveMenu(true) }) { Icon(Icons.Default.Menu, "Menu") }
                        Column(Modifier.weight(1f)) {
                            Text("WEST RAND JUDO", fontWeight = FontWeight.Black, fontSize = 16.sp)
                            Text(localized("DISCIPLINE • RESPECT • EXCELLENCE", "DISSIPLINE • RESPEK • UITNEMENDHEID", "ISIMILO • INHLONIPHO • UBUHLE"), color = Gold, fontSize = 10.sp, letterSpacing = 0.5.sp)
                        }
                    }
                }
            }
        ) { padding ->
            AnimatedContent(targetState = page, transitionSpec = { (slideInHorizontally { it / 7 } + fadeIn()) togetherWith (slideOutHorizontally { -it / 10 } + fadeOut()) }, label = "site page transition") { targetPage ->
                screenState.SaveableStateProvider(targetPage) {
                    SitePage(targetPage, Modifier.padding(padding), ::navigate, chat, scope)
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable private fun SitePage(route: String, modifier: Modifier, onNavigate: (String) -> Unit, chat: ChatConversation, chatScope: kotlinx.coroutines.CoroutineScope) {
    val page = route.substringBefore('/')
    val enquiry = when (route) {
        "contact/tracksuits" -> localized("I'd like to enquire about WRJA tracksuits.", "Ek wil graag navraag doen oor WRJA-sweetpakke.", "Ngicela ulwazi ngama-tracksuit e-WRJA.")
        "contact/posters" -> localized("I'd like to enquire about WRJA posters.", "Ek wil graag navraag doen oor WRJA-plakkate.", "Ngicela ulwazi ngamaphosta e-WRJA.")
        else -> ""
    }
    val descriptions = mapOf(
        "home" to localized("Building discipline, respect, and excellence through judo for athletes of all ages across the West Rand community.", "Bou dissipline, respek en uitnemendheid deur judo vir atlete van alle ouderdomme in die Wes-Rand-gemeenskap.", "Sakha isimilo, inhlonipho nobuhle nge-judo kubasubathi bayo yonke iminyaka emphakathini wase-West Rand."),
        "about" to localized("Building character on and off the mat. We develop confident, disciplined and respectful individuals through judo.", "Bou karakter op en van die mat af. Ons ontwikkel selfversekerde, gedissiplineerde en respekvolle mense deur judo.", "Sakha isimilo ngaphakathi nangaphandle komata. Sithuthukisa abantu abazethembayo, abanesimilo nabahloniphekile nge-judo."),
        "events" to localized("Club gradings, competitions and training activities.", "Klubgraderings, kompetisies en oefenaktiwiteite.", "Ukukleliswa kweklabhu, imincintiswano nemisebenzi yokuqeqesha."),
        "programs" to localized("Judo programmes for children and adults at every level.", "Judo-programme vir kinders en volwassenes op elke vlak.", "Izinhlelo ze-judo zezingane nabantu abadala kuwo wonke amazinga."),
        "news" to localized("Competition results and achievements from WRJA athletes.", "Kompetisie-uitslae en prestasies van WRJA-atlete.", "Imiphumela yemincintiswano nezimpumelelo zabasubathi be-WRJA."),
        "gallery" to localized("Training, competition and community moments.", "Opleiding-, kompetisie- en gemeenskaps-oomblikke.", "Izikhathi zokuqeqesha, imincintiswano nezomphakathi."),
        "faq" to localized("Answers to common questions from new judoka, parents and returning athletes.", "Antwoorde op algemene vrae van nuwe judoka, ouers en terugkerende atlete.", "Izimpendulo zemibuzo evamile evela kuma-judoka amasha, abazali nabasubathi ababuyayo."),
        "contact" to localized("Send us a message or contact our training venues.", "Stuur vir ons 'n boodskap of kontak ons oefenplekke.", "Sithumele umlayezo noma uxhumane nezindawo zethu zokuqeqesha."),
        "chat assistant" to localized("Your WRJA guide for training, programmes, events and club information.", "Jou WRJA-gids vir opleiding, programme, geleenthede en klub-inligting.", "Umhlahlandlela wakho wakwa-WRJA wokuqeqesha, izinhlelo, imicimbi nolwazi lweklabhu.")
    )
    val title = when (page) { "home" -> tr("home"); "my profile" -> tr("my_profile"); "about" -> tr("about"); "events" -> tr("events"); "programs" -> tr("programs"); "news" -> tr("news"); "gallery" -> tr("gallery"); "faq" -> tr("faq"); "contact" -> tr("contact"); "chat assistant" -> tr("chat_assistant"); else -> page.replaceFirstChar { it.uppercase() } }
    BoxWithConstraints(modifier.fillMaxSize().background(Charcoal), contentAlignment = Alignment.TopCenter) {
    val gutter = pageGutter(maxWidth)
    val contentMax = when (page) {
        "gallery" -> 1000.dp
        "my profile", "contact" -> 680.dp
        else -> 820.dp
    }
    val contentWidth = (minOf(maxWidth, contentMax) - gutter * 2).coerceAtLeast(0.dp)
    LazyColumn(Modifier.widthIn(max = 1120.dp).fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
        item {
            Box(Modifier.fillMaxWidth().heightIn(min = if (page == "home") 300.dp else 144.dp).background(Charcoal2), contentAlignment = if (page == "home") Alignment.BottomStart else Alignment.Center) {
                if (page == "home") Image(painterResource(R.drawable.landing_1), "WRJA members training together", Modifier.matchParentSize(), contentScale = ContentScale.Crop)
                Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color(0x44000000), Charcoal))))
                Column(Modifier.padding(horizontal = gutter, vertical = 24.dp), horizontalAlignment = if (page == "home") Alignment.Start else Alignment.CenterHorizontally) {
                    Text(if (page == "home") localized("WELCOME TO\nWEST RAND JUDO\nASSOCIATION", "WELKOM BY\nWEST RAND JUDO\nASSOCIATION", "SIYAKWAMUKELA E\nWEST RAND JUDO\nASSOCIATION") else title.uppercase(), color = Color.White, fontSize = if (page == "home") 29.sp else 29.sp, fontWeight = FontWeight.Black, textAlign = if (page == "home") TextAlign.Start else TextAlign.Center)
                    Spacer(Modifier.height(7.dp)); Text(if (page == "home") localized("DISCIPLINE  •  RESPECT  •  EXCELLENCE", "DISSIPLINE  •  RESPEK  •  UITNEMENDHEID", "ISIMILO  •  INHLONIPHO  •  UBUHLE") else "${tr("home").uppercase()}  /  $title", color = Gold, fontSize = 11.sp, letterSpacing = 1.sp, fontWeight = FontWeight.Bold)
                    if (page == "home") {
                        Spacer(Modifier.height(14.dp))
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Button(
                                onClick = { onNavigate("contact") },
                                modifier = Modifier.heightIn(min = 48.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Charcoal)
                            ) { Text(localized("CONTACT THE CLUB", "KONTAK DIE KLUB", "XHUMANA NEKLABHU"), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold) }
                            OutlinedButton(
                                onClick = { onNavigate("about") },
                                modifier = Modifier.heightIn(min = 48.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Ink),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Gold)
                            ) { Text(localized("LEARN MORE", "LEES MEER", "FUNDA KABANZI"), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold) }
                        }
                    }
                }
            }
        }
        item {
            CompositionLocalProvider(LocalPageWidth provides contentWidth) {
            Column(Modifier.widthIn(max = contentMax).fillMaxWidth().padding(horizontal = gutter, vertical = 24.dp)) {
                Text(if (page == "chat assistant") tr("chat_help") else descriptions[page] ?: "", color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, lineHeight = 27.sp, modifier = Modifier.wrjaReveal())
                Spacer(Modifier.height(22.dp))
                when (page) { "my profile" -> SupabaseMemberProfile(); "contact" -> { ContactEnquiryForm(enquiry); Spacer(Modifier.height(30.dp)); WebsiteContact() }; "chat assistant" -> ChatAssistantScreen(chat, chatScope); else -> ContentCards(page, onNavigate) }
            }
            }
        }
    }
    }
}

@Composable private fun ContentCards(page: String, onNavigate: (String) -> Unit) {

    if (page == "home") {
        WebsiteHome()
        return
    }
    if (page == "programs") {
        WebsitePrograms()
        return
    }
    if (page == "events") {
        var eventSection by rememberSaveable { mutableStateOf("hub") }
        var paymentEventId by rememberSaveable { mutableStateOf<String?>(null) }
        var paymentBackSection by rememberSaveable { mutableStateOf("hub") }
        val eventState = androidx.compose.runtime.saveable.rememberSaveableStateHolder()
        val showPayment: (String) -> Unit = { id ->
            paymentBackSection = eventSection
            paymentEventId = id
            eventSection = "payment"
        }
        androidx.activity.compose.BackHandler(enabled = eventSection != "hub" && eventSection != "payment") { eventSection = "hub" }
        when (eventSection) {
            "standard" -> WebsiteStandardEvents(onBack = { eventSection = "hub" })
            "calendar" -> eventState.SaveableStateProvider("calendar") {
                WebsiteEventsCalendar(onBack = { eventSection = "hub" }, onPayment = showPayment)
            }
            "competitions" -> {
                TextButton(onClick = { eventSection = "hub" }) { Text(tr("events")) }
                TextButton(onClick = {
                    paymentEventId = null
                    paymentBackSection = "competitions"
                    eventSection = "payment"
                }) { Text(localized("EFT payments and submissions", "EFT-betalings en indienings", "Izinkokhelo ze-EFT nokuthunyelwe")) }
                SupabaseEvents(EventListKind.COMPETITIONS, showPayment)
            }
            "schools" -> {
                TextButton(onClick = { eventSection = "hub" }) { Text(tr("events")) }
                SupabaseEvents(EventListKind.SCHOOLS, showPayment)
            }
            "payment" -> EftPaymentsScreen(onBack = { eventSection = paymentBackSection }, initialEventId = paymentEventId)
            "store" -> WebsiteStore(
                onBack = { eventSection = "hub" },
                onTracksuitClick = { onNavigate("contact/tracksuits") },
                onPosterEnquiryClick = { onNavigate("contact/posters") }
            )
            else -> WebsiteEventsHub(
                onStandardEventsClick = { eventSection = "standard" },
                onCalendarClick = { eventSection = "calendar" },
                onCompetitionsClick = { eventSection = "competitions" },
                onSchoolsClick = { eventSection = "schools" },
                onStoreClick = { eventSection = "store" }
            )
        }
        return
    }
    if (page == "news") {
        SupabaseNews()
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
    if (page == "faq") {
        WebsiteFaq(onContactClick = { onNavigate("contact") })
        return
    }
}


@Composable private fun ChatAssistantScreen(chat: ChatConversation, coroutineScope: kotlinx.coroutines.CoroutineScope) {
    val language = LocalAppLanguage.current
    val welcome = tr("chat_welcome")
    val help = tr("chat_help")
    val messages = chat.messages
    val isSending = chat.sending
    val offlineNotice = localized("The online assistant is unavailable. Here’s an offline answer:", "Die aanlyn assistent is onbeskikbaar. Hier is 'n vanlyn antwoord:", "Umsizi we-inthanethi akatholakali. Nansi impendulo engaxhunyiwe:")
    val limitedNotice = localized("The online assistant is receiving too many messages. Wait a moment before trying again. Here’s an offline answer:", "Die aanlyn assistent ontvang te veel boodskappe. Wag 'n oomblik voor jy weer probeer. Hier is 'n vanlyn antwoord:", "Umsizi we-inthanethi uthola imilayezo eminingi kakhulu. Linda isikhashana ngaphambi kokuzama futhi. Nansi impendulo engaxhunyiwe:")

    fun sendQuestion(rawQuestion: String) {
        val question = rawQuestion.replace("\u0000", "").trim()
        if (question.isBlank() || question.length > InputLimits.CHAT_MESSAGE || chat.sending) return

        messages += ChatMessageUi(question, false)
        chat.draft = ""
        chat.sending = true
        coroutineScope.launch {
            try {
                val result = WebsiteChatApi.send(question, chat.onlineExchanges.toList())
                val answer = if (mentionsRetiredTrainingFlow(result.answer)) localChatReply("get started", language) else result.answer
                chat.onlineExchanges.addLast(WebsiteChatExchange(question, answer))
                if (chat.onlineExchanges.size > 12) chat.onlineExchanges.removeFirst()
                messages += ChatMessageUi(answer, true)
            } catch (cancelled: kotlinx.coroutines.CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                reportFailure("Ask online assistant", failure)
                // Retain the useful offline assistant when the server or connection is unavailable.
                val notice = if (failure is WebsiteChatHttpFailure && failure.status == 429) limitedNotice else offlineNotice
                messages += ChatMessageUi("$notice\n\n${localChatReply(question, language)}", true)
            } finally {
                chat.sending = false
            }
        }
    }

    Card(Modifier.fillMaxWidth().wrjaReveal(), colors = CardDefaults.cardColors(containerColor = Charcoal2), border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF3C3C3C)), elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)) {
        Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp).background(Gold).padding(6.dp), contentAlignment = Alignment.Center) { Text("WR", color = Ink, fontWeight = FontWeight.Black, fontSize = 14.sp) }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(tr("wrja_assistant"), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(tr("online_when_connected"), color = Gold, fontSize = 12.sp)
            }
        }
    }
    Spacer(Modifier.height(16.dp))
    ChatBubble(ChatMessageUi(welcome, true), 0)
    ChatBubble(ChatMessageUi(help, true), 1)
    messages.forEachIndexed { index, message -> ChatBubble(message, index + 2) }
    if (isSending) {
        Row(Modifier.padding(bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Gold, strokeWidth = 2.dp)
            Spacer(Modifier.width(8.dp))
            Text("WRJA Assistant is typing…", color = Muted, fontSize = 12.sp)
        }
    }
    Spacer(Modifier.height(12.dp))
    Text(tr("suggested_questions"), color = GoldDark, fontWeight = FontWeight.Bold, fontSize = 11.sp, letterSpacing = 0.7.sp)
    Spacer(Modifier.height(8.dp))
    listOf(tr("question_programme"), tr("question_getting_started"), tr("question_events")).forEach { suggestion ->
        AssistChip(onClick = { sendQuestion(suggestion) }, enabled = !isSending, label = { Text(suggestion, Modifier.padding(vertical = 6.dp), fontSize = 12.sp) }, colors = AssistChipDefaults.assistChipColors(containerColor = OffWhite, labelColor = Ink), modifier = Modifier.padding(end = 6.dp, bottom = 6.dp))
    }
    Spacer(Modifier.height(14.dp))
    Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Charcoal2), border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF3C3C3C)), elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)) {
        Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(value = chat.draft, onValueChange = { chat.draft = boundedInput(chat.draft, it, InputLimits.CHAT_MESSAGE) }, placeholder = { Text(tr("ask_assistant")) }, enabled = !isSending, modifier = Modifier.weight(1f), singleLine = true, colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Gold, unfocusedBorderColor = Color.LightGray))
            Spacer(Modifier.width(8.dp))
            IconButton(onClick = { sendQuestion(chat.draft) }, enabled = chat.draft.isNotBlank() && !isSending, colors = IconButtonDefaults.iconButtonColors(contentColor = Ink, disabledContentColor = Muted)) { Icon(Icons.Default.Send, "Send message") }
        }
    }
    Text(tr("chat_preview"), color = Muted, fontSize = 11.sp, lineHeight = 16.sp, modifier = Modifier.padding(top = 10.dp))
}

@Composable private fun ChatBubble(message: ChatMessageUi, index: Int) {
    Row(Modifier.fillMaxWidth().padding(bottom = 10.dp), horizontalArrangement = if (message.fromAssistant) Arrangement.Start else Arrangement.End) {
        Surface(color = if (message.fromAssistant) Charcoal2 else Gold, shape = MaterialTheme.shapes.medium, tonalElevation = 4.dp, shadowElevation = 4.dp, border = if (message.fromAssistant) androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF343434)) else null, modifier = Modifier.wrjaReveal(index)) {
            Text(message.text, Modifier.widthIn(max = minOf(LocalPageWidth.current * 0.88f, 600.dp)).padding(horizontal = 15.dp, vertical = 12.dp), color = if (message.fromAssistant) Ink else Charcoal, fontSize = 14.sp, lineHeight = 20.sp)
        }
    }
}
