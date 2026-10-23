package za.co.wrja.mobile

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import java.time.LocalDate
import java.time.Period

enum class AppLanguage(val code: String, val label: String) {
    ENGLISH("en", "English"),
    AFRIKAANS("af", "Afrikaans"),
    ISIZULU("zu", "isiZulu")
}

val LocalAppLanguage = compositionLocalOf { AppLanguage.ENGLISH }

object LanguageStore {
    private const val Preferences = "wrja_preferences"
    private const val LanguageKey = "app_language"

    fun read(context: Context): AppLanguage =
        AppLanguage.entries.firstOrNull {
            it.code == context.getSharedPreferences(Preferences, Context.MODE_PRIVATE)
                .getString(LanguageKey, AppLanguage.ENGLISH.code)
        } ?: AppLanguage.ENGLISH

    fun save(context: Context, language: AppLanguage) {
        context.getSharedPreferences(Preferences, Context.MODE_PRIVATE)
            .edit().putString(LanguageKey, language.code).apply()
    }
}

private val translations = mapOf(
    "home" to arrayOf("Home", "Tuis", "Ekhaya"),
    "my_profile" to arrayOf("My Profile", "My Profiel", "Iphrofayela Lami"),
    "about" to arrayOf("About", "Oor Ons", "Mayelana Nathi"),
    "events" to arrayOf("Events", "Geleenthede", "Imicimbi"),
    "programs" to arrayOf("Programs", "Programme", "Izinhlelo"),
    "book" to arrayOf("Book", "Bespreek", "Bhukha"),
    "news" to arrayOf("News", "Nuus", "Izindaba"),
    "gallery" to arrayOf("Gallery", "Galery", "Igalari"),
    "faq" to arrayOf("FAQ", "Gereelde vrae", "Imibuzo Evame Ukubuzwa"),
    "contact" to arrayOf("Contact", "Kontak", "Xhumana"),
    "chat_assistant" to arrayOf("Chat Assistant", "Kletsassistent", "Umsizi Wengxoxo"),
    "log_out" to arrayOf("Log out", "Meld af", "Phuma"),
    "login" to arrayOf("Login", "Meld aan", "Ngena"),
    "change_language" to arrayOf("Change language", "Verander taal", "Shintsha ulimi"),
    "welcome_back" to arrayOf("Welcome back", "Welkom terug", "Siyakwamukela futhi"),
    "login_intro" to arrayOf("Log in to manage your registrations, view grading history, and stay up to date with the club.", "Meld aan om jou registrasies te bestuur, graderingsgeskiedenis te sien en op hoogte van die klub te bly.", "Ngena ukuze uphathe ukubhalisa kwakho, ubone umlando wamabanga futhi uhlale wazi ngezindaba zeklabhu."),
    "email" to arrayOf("Email address", "E-posadres", "Ikheli le-imeyili"),
    "password" to arrayOf("Password", "Wagwoord", "Iphasiwedi"),
    "your_password" to arrayOf("Your password", "Jou wagwoord", "Iphasiwedi yakho"),
    "remember_me" to arrayOf("Remember me", "Onthou my", "Ngikhumbule"),
    "fingerprint_unlock" to arrayOf("enable fingerprint unlock", "aktiveer vingerafdruk-ontsluiting", "vula ukungena ngesigxivizo somunwe"),
    "forgot_password" to arrayOf("Forgot password?", "Wagwoord vergeet?", "Ukhohlwe iphasiwedi?"),
    "dont_have_account" to arrayOf("Don't have an account? Sign up", "Het jy nie 'n rekening nie? Registreer", "Awunayo i-akhawunti? Bhalisa"),
    "wrja_assistant" to arrayOf("WRJA ASSISTANT", "WRJA-ASSISTENT", "UMSIZI WAKWA-WRJA"),
    "online_when_connected" to arrayOf("●  Online when connected", "●  Aanlyn wanneer gekoppel", "●  Ku-inthanethi lapho kuxhunyiwe"),
    "chat_welcome" to arrayOf("Hello! I’m the WRJA Assistant. How can I help with your judo journey today?", "Hallo! Ek is die WRJA-assistent. Hoe kan ek vandag met jou judo-reis help?", "Sawubona! Ngingumsizi wakwa-WRJA. Ngingakusiza kanjani ohambweni lwakho lwe-judo namuhla?"),
    "chat_help" to arrayOf("I can help you find a programme, prepare for an event, or point you to the right club contact.", "Ek kan jou help om 'n program te vind, vir 'n geleentheid voor te berei, of jou na die regte klubkontak te verwys.", "Ngingakusiza uthole uhlelo, ulungiselele umcimbi, noma ngikuqondise koxhumana naye ofanele weklabhu."),
    "suggested_questions" to arrayOf("SUGGESTED QUESTIONS", "VOORGESTELDE VRAE", "IMIBUZO EPHAKANYISIWE"),
    "question_programme" to arrayOf("Which programme is right for me?", "Watter program is reg vir my?", "Iluphi uhlelo olungifanele?"),
    "question_trial" to arrayOf("How do I book a free trial?", "Hoe bespreek ek 'n gratis proefsessie?", "Ngisibhukha kanjani isivivinyo samahhala?"),
    "question_events" to arrayOf("What events are coming up?", "Watter geleenthede kom op?", "Yimiphi imicimbi ezayo?"),
    "ask_assistant" to arrayOf("Ask the WRJA Assistant…", "Vra die WRJA-assistent…", "Buza umsizi wakwa-WRJA…"),
    "chat_preview" to arrayOf("Connected to the secure WRJA Assistant. If you are offline, the app can still provide helpful local guidance.", "Gekoppel aan die veilige WRJA-assistent. As jy vanlyn is, kan die app steeds nuttige plaaslike leiding bied.", "Ixhunywe kumsizi ovikelekile wakwa-WRJA. Uma ungaxhunyiwe ku-inthanethi, uhlelo lokusebenza lusenganikeza usizo lwasendaweni.")
)

@Composable
fun tr(key: String): String {
    val index = when (LocalAppLanguage.current) {
        AppLanguage.ENGLISH -> 0
        AppLanguage.AFRIKAANS -> 1
        AppLanguage.ISIZULU -> 2
    }
    return translations[key]?.get(index) ?: key
}

/**
 * Use this for content that is specific to a screen rather than a shared UI label.
 * Keeping the language lookup in Compose makes the text update immediately when a
 * member changes language from the navigation drawer.
 */
@Composable
fun localized(english: String, afrikaans: String, isiZulu: String): String =
    when (LocalAppLanguage.current) {
        AppLanguage.ENGLISH -> english
        AppLanguage.AFRIKAANS -> afrikaans
        AppLanguage.ISIZULU -> isiZulu
    }

/** Only letters, spaces, apostrophes and hyphens are valid in a person's name. */
fun sanitizePersonName(value: String): String =
    value.filter { character ->
        character.isLetter() || character == ' ' || character == '-' ||
            character == '\'' || character == '’'
    }

fun isValidPersonName(value: String): Boolean {
    val trimmed = value.trim()
    return trimmed.length >= 2 && trimmed.any(Char::isLetter) &&
        trimmed.all { character ->
            character.isLetter() || character == ' ' || character == '-' ||
                character == '\'' || character == '’'
        }
}

fun isValidEmailAddress(value: String): Boolean =
    android.util.Patterns.EMAIL_ADDRESS.matcher(value.trim()).matches()

fun isValidRegistrationPassword(value: String): Boolean =
    value.length >= 8 && value.any(Char::isLetter) && value.any(Char::isDigit)

/** Keep telephone input readable while preventing letters and other invalid symbols. */
fun sanitizePhoneNumber(value: String): String =
    value.filter { character -> character.isDigit() || character in setOf('+', ' ', '-', '(', ')') }

fun isValidPhoneNumber(value: String): Boolean {
    val trimmed = value.trim()
    return trimmed.count(Char::isDigit) in 7..15 &&
        trimmed.all { character -> character.isDigit() || character in setOf('+', ' ', '-', '(', ')') }
}

fun isValidAdultDate(value: String): Boolean = try {
    val birthDate = LocalDate.parse(value.trim())
    !birthDate.isAfter(LocalDate.now()) && Period.between(birthDate, LocalDate.now()).years >= 18
} catch (_: Exception) {
    false
}
