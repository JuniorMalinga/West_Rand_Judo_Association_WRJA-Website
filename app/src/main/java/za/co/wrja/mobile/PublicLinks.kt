package za.co.wrja.mobile

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast

internal fun openPublicWebsite(context: Context, address: String) {
    try {
        val uri = Uri.parse(address.trim())
        require(uri.scheme in listOf("https", "http") && !uri.host.isNullOrBlank() && uri.userInfo == null)
        context.startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (failure: Exception) {
        reportFailure("Open external link", failure)
        val language = try { LanguageStore.read(context) } catch (failure: Exception) {
            reportFailure("Read link message language", failure)
            AppLanguage.ENGLISH
        }
        val message = when (language) {
            AppLanguage.ENGLISH -> "Could not open this link. Check that a browser is installed, or contact WRJA."
            AppLanguage.AFRIKAANS -> "Kon nie die skakel oopmaak nie. Gaan na of 'n blaaier geïnstalleer is, of kontak WRJA."
            AppLanguage.ISIZULU -> "Isixhumanisi asivulekanga. Hlola ukuthi isiphequluli sifakiwe noma uxhumane ne-WRJA."
        }
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
    }
}

internal fun publicMediaUrl(path: String): String? {
    val relative = path.trim().trimStart('/').removePrefix("public-media/")
    val parts = relative.split('/')
    if (relative.contains("://") || parts.any { it.isBlank() || it == "." || it == ".." }) return null
    val builder = Uri.parse(SUPABASE_URL.trimEnd('/') + "/storage/v1/object/public/public-media").buildUpon()
    parts.forEach(builder::appendPath)
    return builder.build().toString()
}
