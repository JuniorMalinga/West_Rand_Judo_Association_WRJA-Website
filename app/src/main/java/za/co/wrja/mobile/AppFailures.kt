package za.co.wrja.mobile

import android.util.Log
import kotlinx.coroutines.CancellationException
import java.io.ByteArrayOutputStream
import java.io.InputStream

/** Only explicitly curated messages may be displayed directly to a user. */
internal class UserFacingFailure(message: String) : IllegalStateException(message)

internal fun reportFailure(operation: String, failure: Exception) {
    if (failure is CancellationException) throw failure
    // Exception messages and stack traces can contain URLs, tokens and user data.
    Log.w("WRJA", "$operation failed (${failure.javaClass.simpleName})")
}

internal fun actionFailure(operation: String, failure: Exception, fallback: String): String {
    reportFailure(operation, failure)
    return (failure as? UserFacingFailure)?.message ?: fallback
}

@androidx.compose.runtime.Composable
internal fun loadFailureMessage(): String = localized(
    "Could not load this section. Check your connection and try again.",
    "Kon nie hierdie afdeling laai nie. Gaan jou verbinding na en probeer weer.",
    "Ayikwazanga ukulayisha lesi sigaba. Hlola uxhumano lwakho bese uzama futhi."
)

@androidx.compose.runtime.Composable
internal fun authFailureMessage(connection: String, fallback: String): (Exception) -> String {
    val credentials = localized("Incorrect email or password.", "Verkeerde e-posadres of wagwoord.", "I-imeyili noma iphasiwedi ayilungile.")
    val confirm = localized("Confirm your email before signing in.", "Bevestig jou e-posadres voordat jy aanmeld.", "Qinisekisa i-imeyili yakho ngaphambi kokungena.")
    val exists = localized("An account already exists. Try signing in.", "'n Rekening bestaan reeds. Probeer aanmeld.", "I-akhawunti isivele ikhona. Zama ukungena.")
    val limited = localized("Too many attempts. Wait a moment and try again.", "Te veel pogings. Wag 'n oomblik en probeer weer.", "Imizamo miningi kakhulu. Linda isikhashana bese uzama futhi.")
    val disabled = localized("Registration is unavailable right now. Contact WRJA for help.", "Registrasie is tans onbeskikbaar. Kontak WRJA vir hulp.", "Ukubhalisa akutholakali okwamanje. Xhumana ne-WRJA ukuze uthole usizo.")
    val weak = localized("Choose a stronger password.", "Kies 'n sterker wagwoord.", "Khetha iphasiwedi enamandla.")
    return { failure ->
        reportFailure("Authentication", failure)
        when {
            failure is java.io.IOException -> connection
            failure !is AuthRequestException -> fallback
            failure.status == 429 -> limited
            else -> when (failure.code) {
                "invalid_credentials" -> credentials
                "email_not_confirmed" -> confirm
                "user_already_exists", "email_exists" -> exists
                "over_email_send_rate_limit", "over_request_rate_limit" -> limited
                "signup_disabled" -> disabled
                "weak_password" -> weak
                else -> fallback
            }
        }
    }
}

internal suspend fun <T> recoverOperation(
    operation: String,
    onFailure: () -> T,
    block: suspend () -> T
): T = try {
    block()
} catch (failure: Exception) {
    reportFailure(operation, failure)
    onFailure()
}

/** Reject unexpectedly large server responses rather than exhausting device memory. */
internal fun InputStream.readBoundedBytes(limit: Int = 8 * 1024 * 1024): ByteArray = use { input ->
    val output = ByteArrayOutputStream()
    val buffer = ByteArray(8192)
    while (true) {
        val count = input.read(buffer)
        if (count < 0) break
        check(count <= limit - output.size()) { "Response exceeds size limit." }
        output.write(buffer, 0, count)
    }
    output.toByteArray()
}

internal fun InputStream.readBoundedText(limit: Int = 8 * 1024 * 1024): String =
    readBoundedBytes(limit).toString(Charsets.UTF_8)
