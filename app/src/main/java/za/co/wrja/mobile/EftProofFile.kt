package za.co.wrja.mobile

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.net.Uri
import android.provider.OpenableColumns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.util.UUID
import kotlin.math.max
import kotlin.math.roundToInt

internal data class EftProofFile(
    val id: String,
    val name: String,
    val mimeType: String,
    val extension: String,
    val bytes: ByteArray
)

internal object EftProofFiles {
    private const val MIB = 1024 * 1024

    suspend fun read(context: Context, uri: Uri): EftProofFile = withContext(Dispatchers.IO) {
        val resolver = context.contentResolver
        val originalName = resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
            ?.use { cursor ->
                if (cursor.moveToFirst()) cursor.getString(0) else null
            } ?: "payment-proof"
        val safeName = originalName.replace(Regex("[^A-Za-z0-9 ._()-]"), "_").take(110)
            .ifBlank { "payment-proof" }

        // Bound the input before decoding; images are resized like the website.
        val bytes = resolver.openInputStream(uri)?.use { input ->
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            while (true) {
                val count = input.read(buffer)
                if (count < 0) break
                require(output.size() + count <= 20 * MIB) {
                    "Choose a file smaller than 20 MB. PDFs must be under 4 MB."
                }
                output.write(buffer, 0, count)
            }
            output.toByteArray()
        } ?: error("The selected file could not be opened. Please choose it again.")
        require(bytes.isNotEmpty()) { "The selected file is empty." }

        val isPdf = bytes.take(5).toByteArray().contentEquals("%PDF-".toByteArray())
        val isJpeg = bytes.size >= 3 && bytes[0] == 0xff.toByte() &&
            bytes[1] == 0xd8.toByte() && bytes[2] == 0xff.toByte()
        val isPng = bytes.size >= 8 && bytes.copyOfRange(0, 8).contentEquals(
            byteArrayOf(0x89.toByte(), 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
        )
        require(isPdf || isJpeg || isPng) { "Choose a PDF, JPG or PNG file." }
        val id = UUID.randomUUID().toString()
        if (isPdf) {
            require(bytes.size <= 4 * MIB) { "That PDF is over 4 MB. Choose a smaller PDF." }
            EftProofFile(id, safeName.substringBeforeLast('.') + ".pdf", "application/pdf", "pdf", bytes)
        } else {
            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
            require(options.outWidth > 0 && options.outHeight > 0) { "This image could not be decoded." }
            // Sample first, so a huge photograph cannot allocate a full-size bitmap.
            var sample = 1
            while (max(options.outWidth, options.outHeight) / sample > 3200) sample *= 2
            val source = BitmapFactory.decodeByteArray(bytes, 0, bytes.size,
                BitmapFactory.Options().apply { inSampleSize = sample })
                ?: error("This image could not be opened.")
            try {
                val scale = minOf(1.0, 1600.0 / max(source.width, source.height))
                val target = Bitmap.createBitmap(
                    max(1, (source.width * scale).roundToInt()),
                    max(1, (source.height * scale).roundToInt()), Bitmap.Config.ARGB_8888
                )
                val compressed = try {
                    Canvas(target).apply {
                        drawColor(Color.WHITE)
                        drawBitmap(source, null, android.graphics.Rect(0, 0, target.width, target.height),
                            android.graphics.Paint(android.graphics.Paint.FILTER_BITMAP_FLAG))
                    }
                    ByteArrayOutputStream().use { output ->
                        check(target.compress(Bitmap.CompressFormat.JPEG, 80, output)) {
                            "The image could not be prepared."
                        }
                        output.toByteArray()
                    }
                } finally { target.recycle() }
                require(compressed.size <= 6 * MIB) { "This image is too large after resizing." }
                EftProofFile(id, safeName.substringBeforeLast('.') + ".jpg", "image/jpeg", "jpg", compressed)
            } finally { source.recycle() }
        }
    }
}
