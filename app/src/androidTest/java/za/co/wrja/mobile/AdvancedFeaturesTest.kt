package za.co.wrja.mobile

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class AdvancedFeaturesTest {
    @Test fun sqliteQueueSurvivesReopenAndScrubsDeliveredPayload() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val database = "outbox-test-${UUID.randomUUID()}.db"
        try {
            val id = ContactOutbox(context, database).use { it.add("Test Member", "test@example.com", "", "Test only; never submitted") }
            ContactOutbox(context, database).use {
                assertEquals("queued", it.entries().single().status)
                assertNotNull(it.claim(id))
                // A restarted worker must not silently replay an ambiguous POST.
                assertNull(it.claim(id))
                assertEquals("review", it.entries().single().status)
                it.status(id, "sent_email")
                it.readableDatabase.rawQuery("SELECT name,email,message FROM enquiries WHERE id=?", arrayOf(id)).use { row ->
                    assertTrue(row.moveToFirst())
                    repeat(3) { column -> assertEquals("", row.getString(column)) }
                }
                it.delete(id)
                assertTrue(it.entries().isEmpty())
            }
        } finally { context.deleteDatabase(database) }
    }

    @Test fun keystoreCipherRoundTripsWithoutPlaintextAndRejectsTampering() {
        val original = "test-refresh-token-${UUID.randomUUID()}"
        val encrypted = SessionCipher.encrypt(original)
        assertFalse(encrypted.contains(original))
        assertEquals(original, SessionCipher.decrypt(encrypted))
        val damaged = encrypted.dropLast(4) + "AAAA"
        assertTrue(runCatching { SessionCipher.decrypt(damaged) }.isFailure)
    }

    @Test fun allRequiredLanguagesArePersisted() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val previous = LanguageStore.read(context)
        try {
            AppLanguage.entries.forEach { language ->
                LanguageStore.save(context, language)
                assertEquals(language, LanguageStore.read(context))
            }
        } finally { LanguageStore.save(context, previous) }
    }
}
