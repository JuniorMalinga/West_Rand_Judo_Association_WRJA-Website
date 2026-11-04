package za.co.wrja.mobile

import androidx.compose.ui.unit.dp

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class AdvancedFeaturesTest {
    @Test fun layoutsUseAvailableWidthAndRespectLargerText() {
        assertEquals(12.dp, pageGutter(320.dp))
        assertEquals(20.dp, pageGutter(411.dp))
        assertEquals(32.dp, pageGutter(840.dp))
        assertEquals(1, galleryColumns(290.dp, 1f))
        assertEquals(2, galleryColumns(360.dp, 1f))
        assertEquals(1, galleryColumns(360.dp, 2f))
        assertEquals(3, galleryColumns(760.dp, 1f))
        assertEquals(2, galleryColumns(760.dp, 2f))
    }

    @Test fun productionChatRepliesDoNotRequireLegacySuccessOrSessionId() {
        for (mode in listOf("local", "gemini", "fallback", "handoff")) {
            val reply = WebsiteChatApi.parseReply("""{"answer":"Judo is a martial art.","mode":"$mode","durationMs":5}""")
            assertEquals(mode, reply.mode)
            assertEquals("Judo is a martial art.", reply.answer)
        }
        for (invalid in listOf("<html>Not an API</html>", """{"answer":"","mode":"gemini"}""", """{"success":true,"answer":"Old API"}""")) {
            assertTrue(runCatching { WebsiteChatApi.parseReply(invalid) }.exceptionOrNull() is java.io.IOException)
        }
    }

    @Test fun chatSendsRecentCompletedTurnsInProductionFormat() {
        val exchanges = (1..14).map { WebsiteChatExchange("Question $it", "Answer $it") }
        val body = WebsiteChatApi.requestBody(" Tell me more ", exchanges)
        assertEquals("Tell me more", body.getString("message"))
        assertFalse(body.has("sessionId"))
        val history = body.getJSONArray("history")
        assertEquals(24, history.length())
        assertEquals("user", history.getJSONObject(0).getString("role"))
        assertEquals("Question 3", history.getJSONObject(0).getString("content"))
        assertEquals("assistant", history.getJSONObject(23).getString("role"))
        assertEquals("Answer 14", history.getJSONObject(23).getString("content"))
    }

    @Test fun chatHistoryStaysWithinWebsitePayloadLimits() {
        val history = WebsiteChatApi.requestBody("Next question", List(20) {
            WebsiteChatExchange("x".repeat(2000), "y".repeat(4000))
        }).getJSONArray("history")
        val lengths = (0 until history.length()).map { history.getJSONObject(it).getString("content").length }
        assertTrue(lengths.isNotEmpty() && lengths.all { it <= 2400 })
        assertTrue(lengths.sum() <= 24_000)
    }

    @Test fun unexpectedErrorsDoNotExposeTechnicalDetails() {
        val fallback = "Could not load this section."
        assertEquals(fallback, actionFailure("Test load", IllegalStateException("raw server response"), fallback))
        assertEquals("Choose a smaller file.", actionFailure("Test file", UserFacingFailure("Choose a smaller file."), fallback))
    }

    @Test fun operationRecoveryDoesNotSwallowCancellation() = runBlocking {
        assertEquals("retry", recoverOperation("Test I/O", { "retry" }) { throw java.io.IOException("not available") })
        val cancelled = CancellationException("left screen")
        try {
            recoverOperation("Test cancellation", { fail("Cancelled operations must not show a fallback.") }) { throw cancelled }
            fail("Cancellation should propagate.")
        } catch (failure: CancellationException) {
            assertSame(cancelled, failure)
        }
    }

    @Test fun oversizedResponsesAreRejectedAndStreamsAreClosed() {
        assertEquals("abcd", "abcd".byteInputStream().readBoundedText(limit = 4))
        var closed = false
        val input = object : java.io.ByteArrayInputStream(ByteArray(5)) {
            override fun close() { closed = true }
        }
        try {
            input.readBoundedBytes(limit = 4)
            fail("An over-limit response must not be read.")
        } catch (_: IllegalStateException) {
            assertTrue(closed)
        }
    }

    @Test fun phoneFormattingAndLimitsAreEnforced() {
        assertTrue(isValidPhoneNumber("+27 (11) 123-4567"))
        assertTrue(isValidPhoneNumber("011.123.4567"))
        assertFalse(isValidPhoneNumber("011+1234567"))
        assertFalse(isValidPhoneNumber("+27 (11 123-4567"))
        assertFalse(isValidPhoneNumber("011 123456x"))
        assertFalse(isValidPhoneNumber("1".repeat(16)))
        assertFalse(isValidPhoneNumber("011" + " ".repeat(30) + "1234567"))
        assertEquals("0111234567", editPhoneNumber("", "011ABC1234567"))
        assertEquals("0111234567", editPhoneNumber("0111234567", "1".repeat(16)))
        assertEquals("0111234567", editPhoneNumber("0111234567", "011" + " ".repeat(30) + "1234567"))
    }

    @Test fun textLimitsAndDatesRejectInvalidValues() {
        assertEquals("abc", boundedInput("abc", "abcd", 3))
        assertEquals("Anne-Marie", editPersonName("", "Anne-Marie9"))
        assertTrue(isValidPersonName("Zoë D’Arcy"))
        assertFalse(isValidPersonName("x".repeat(61)))
        assertTrue(isValidPersonName("x".repeat(100), InputLimits.CONTACT_NAME))
        assertFalse(isValidEmailAddress("a".repeat(250) + "@example.com"))
        assertTrue(isValidBirthDate("2000-02-29"))
        assertFalse(isValidBirthDate("2001-02-29"))
        assertFalse(isValidBirthDate("9999-01-01"))
        assertTrue(isValidRegistrationPassword("validPass1"))
        assertFalse(isValidRegistrationPassword("a1".repeat(65)))
    }

    @Test fun sqliteQueueSurvivesReopenAndScrubsDeliveredPayload() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val database = "outbox-test-${UUID.randomUUID()}.db"
        try {
            val id = ContactOutbox(context, database).use { it.add("owner-a", "Test Member", "test@example.com", "", "Test only; never submitted") }
            ContactOutbox(context, database).use {
                assertEquals("queued", it.entries("owner-a").single().status)
                assertTrue(it.entries("owner-b").isEmpty())
                assertEquals("", it.draft("owner-b", id))
                assertFalse(it.delete("owner-b", id))
                assertTrue(it.draft("owner-a", id).contains("Test only"))
                assertNotNull(it.claim(id))
                // A restarted worker must not silently replay an ambiguous POST.
                assertNull(it.claim(id))
                assertEquals("review", it.entries("owner-a").single().status)
                it.status(id, "sent_email")
                it.readableDatabase.rawQuery("SELECT name,email,message FROM enquiries WHERE id=?", arrayOf(id)).use { row ->
                    assertTrue(row.moveToFirst())
                    repeat(3) { column -> assertEquals("", row.getString(column)) }
                }
                it.delete("owner-a", id)
                assertTrue(it.entries("owner-a").isEmpty())
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
