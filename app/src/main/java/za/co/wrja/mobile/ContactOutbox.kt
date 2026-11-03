package za.co.wrja.mobile

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.CancellationException
import java.util.UUID
import java.util.concurrent.TimeUnit

data class OutboxEntry(val id: String, val status: String)

/** App-private SQLite outbox. No auth tokens are stored in queued public enquiries. */
class ContactOutbox(context: Context, databaseName: String = "contact_outbox.db") : SQLiteOpenHelper(context, databaseName, null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE enquiries (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL)")
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    fun add(name: String, email: String, phone: String, message: String): String {
        val id = UUID.randomUUID().toString()
        writableDatabase.insertOrThrow("enquiries", null, ContentValues().apply {
            put("id", id); put("name", name.trim()); put("email", email.trim()); put("phone", phone.trim())
            put("message", message.trim()); put("status", "queued")
        })
        return id
    }
    fun entries(): List<OutboxEntry> = readableDatabase.rawQuery("SELECT id,status FROM enquiries ORDER BY rowid DESC LIMIT 20", null).use { cursor ->
        buildList { while (cursor.moveToNext()) add(OutboxEntry(cursor.getString(0), cursor.getString(1))) }
    }
    fun status(id: String, value: String) {
        writableDatabase.update("enquiries", ContentValues().apply {
            put("status", value)
            if (value.startsWith("sent")) { put("name", ""); put("email", ""); put("phone", ""); put("message", "") }
        }, "id=?", arrayOf(id))
    }
    fun delete(id: String): Boolean = writableDatabase.delete("enquiries", "id=? AND status<>'sending'", arrayOf(id)) > 0
    fun draft(id: String): String = readableDatabase.rawQuery("SELECT name,email,phone,message FROM enquiries WHERE id=?", arrayOf(id)).use { cursor ->
        if (!cursor.moveToFirst()) "" else (0..3).map { cursor.getString(it) }.filter { it.isNotBlank() }.joinToString("\n\n")
    }

    fun claim(id: String): List<String>? {
        val db = writableDatabase
        db.beginTransaction()
        try {
            val row = db.rawQuery("SELECT name,email,phone,message,status FROM enquiries WHERE id=?", arrayOf(id)).use { cursor ->
                if (!cursor.moveToFirst()) null else List(5) { cursor.getString(it) }
            }
            when (row?.get(4)) {
                "queued" -> status(id, "sending")
                "sending" -> status(id, "review")
            }
            db.setTransactionSuccessful()
            return if (row?.get(4) == "queued") row else null
        } finally { db.endTransaction() }
    }

    companion object {
        fun schedule(context: Context, id: String) {
            val work = OneTimeWorkRequestBuilder<ContactSyncWorker>()
                .setInputData(workDataOf("id" to id))
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS).build()
            WorkManager.getInstance(context).enqueueUniqueWork("contact-$id", ExistingWorkPolicy.KEEP, work)
        }
    }
}

class ContactSyncWorker(context: Context, parameters: WorkerParameters) : CoroutineWorker(context, parameters) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val id = inputData.getString("id") ?: return@withContext Result.failure()
        ContactOutbox(applicationContext).use { db ->
            val row = db.claim(id) ?: return@withContext Result.success()
            // Never automatically resend an uncertain POST: the existing website has no
            // idempotency contract, so it may already have stored and emailed the message.
            try {
                val confirmed = WebsiteContactApi.submit(row[0], row[1], row[2], row[3])
                db.status(id, if (confirmed) "sent_email" else "sent")
                Result.success()
            } catch (cancelled: CancellationException) {
                db.status(id, "review")
                throw cancelled
            } catch (failure: ContactRejectedException) {
                if (failure.status == 429) { db.status(id, "queued"); Result.retry() }
                else { db.status(id, if (failure.status >= 500) "review" else "rejected"); Result.success() }
            } catch (_: java.net.UnknownHostException) {
                db.status(id, "queued"); Result.retry()
            } catch (_: java.net.ConnectException) {
                db.status(id, "queued"); Result.retry()
            } catch (_: Exception) {
                db.status(id, "review"); Result.success()
            }
        }
    }
}
