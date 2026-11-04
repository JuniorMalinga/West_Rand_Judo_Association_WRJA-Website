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

internal object InputLimits {
    const val NAME = 60
    const val CONTACT_NAME = 100
    const val RESET_NAME = 120
    const val BOOKING_NAME = 150
    const val EMAIL = 254
    const val PHONE = 30
    const val PHONE_DIGITS = 15
    const val PASSWORD = 128
    const val LOGIN_PASSWORD = 1024
    const val CONTACT_MESSAGE = 3000
    const val BOOKING_NOTES = 2000
    const val CHAT_MESSAGE = 2000
    const val WEIGHT_CATEGORY = 60
}

// Reject overlong edits, especially pasted passwords and numbers; never silently
// submit a truncated value that might belong to someone else.
internal fun boundedInput(previous: String, candidate: String, max: Int): String =
    if (candidate.length <= max || candidate.length < previous.length) candidate else previous

private fun Char.isNameCharacter(): Boolean =
    isLetter() || this in " .-'’" || Character.getType(this) in setOf(
        Character.NON_SPACING_MARK.toInt(), Character.COMBINING_SPACING_MARK.toInt()
    )

internal fun editPersonName(previous: String, candidate: String, max: Int = InputLimits.NAME): String =
    boundedInput(previous, candidate.filter { it.isNameCharacter() }, max)

fun isValidPersonName(value: String, max: Int = InputLimits.NAME): Boolean {
    val trimmed = value.trim()
    return value.length <= max && trimmed.isNotEmpty() && trimmed.any(Char::isLetter) &&
        trimmed.all { it.isNameCharacter() }
}

fun isValidEmailAddress(value: String): Boolean =
    value.length <= InputLimits.EMAIL && android.util.Patterns.EMAIL_ADDRESS.matcher(value.trim()).matches()

fun isValidRegistrationPassword(value: String): Boolean =
    value.length in 8..InputLimits.PASSWORD && value.any { it in 'A'..'Z' || it in 'a'..'z' } &&
        value.any { it in '0'..'9' } && value.none(Char::isISOControl)

private fun Char.isPhoneCharacter() = this in '0'..'9' || this in "+ -()."

internal fun editPhoneNumber(previous: String, candidate: String): String {
    val clean = candidate.filter { it.isPhoneCharacter() }
    if (clean.indexOf('+') > 0 || clean.count { it == '+' } > 1 ||
        clean.count { it in '0'..'9' } > InputLimits.PHONE_DIGITS) return previous
    return boundedInput(previous, clean, InputLimits.PHONE)
}

fun isValidPhoneNumber(value: String): Boolean {
    val trimmed = value.trim()
    if (value.length > InputLimits.PHONE || trimmed.count { it in '0'..'9' } !in 7..InputLimits.PHONE_DIGITS ||
        !trimmed.all { it.isPhoneCharacter() } || trimmed.indexOf('+') > 0 || trimmed.count { it == '+' } > 1 ||
        trimmed.first() !in "+(0123456789" || trimmed.last() !in ")0123456789") return false
    var open = false
    var digitsInGroup = false
    for (char in trimmed) when {
        char == '(' -> { if (open) return false; open = true; digitsInGroup = false }
        char == ')' -> { if (!open || !digitsInGroup) return false; open = false }
        open && char in '0'..'9' -> digitsInGroup = true
    }
    return !open
}

internal fun editBirthDate(previous: String, candidate: String): String =
    boundedInput(previous, candidate.filter { it in '0'..'9' || it == '-' }, 10)

internal fun isValidBirthDate(value: String): Boolean =
    value.matches(Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}")) &&
        runCatching {
            val date = LocalDate.parse(value)
            date.year > 0 && !date.isAfter(LocalDate.now())
        }.getOrDefault(false)

fun isValidAdultDate(value: String): Boolean = try {
    val birthDate = LocalDate.parse(value.trim())
    isValidBirthDate(value.trim()) && Period.between(birthDate, LocalDate.now()).years >= 18
} catch (_: Exception) {
    false
}
