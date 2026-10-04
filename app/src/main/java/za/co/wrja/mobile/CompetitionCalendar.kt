package za.co.wrja.mobile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kizitonwose.calendar.compose.HorizontalCalendar
import com.kizitonwose.calendar.compose.rememberCalendarState
import com.kizitonwose.calendar.core.DayPosition
import com.kizitonwose.calendar.core.OutDateStyle
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val CalendarGold = Color(0xFFF1BD16)
private val CalendarInk = Color(0xFF090909)
private val CalendarMuted = Color(0xFFA6A6A6)
private val MonthLabel = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH)
private val DateLabel = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH)

private data class CalendarCompetition(
    val id: String,
    val title: String,
    val date: LocalDate,
    val time: String,
    val location: String
)

@Composable
fun CompetitionCalendar() {
    val currentMonth = remember { YearMonth.now(ZoneId.of("Africa/Johannesburg")) }
    val startMonth = remember(currentMonth) { currentMonth.minusYears(10) }
    val endMonth = remember(currentMonth) { currentMonth.plusYears(10) }
    val state = rememberCalendarState(
        startMonth = startMonth,
        endMonth = endMonth,
        firstVisibleMonth = currentMonth,
        firstDayOfWeek = DayOfWeek.MONDAY,
        outDateStyle = OutDateStyle.EndOfGrid
    )
    val visibleMonth = state.firstVisibleMonth.yearMonth
    val scope = rememberCoroutineScope()
    var selectedDate by rememberSaveable { mutableStateOf<String?>(null) }
    var competitions by remember { mutableStateOf<List<CalendarCompetition>>(emptyList()) }
    var loadedMonth by remember { mutableStateOf<YearMonth?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var reload by remember { mutableStateOf(0) }

    LaunchedEffect(visibleMonth, reload, SupabaseAuth.isLoggedIn) {
        loading = true
        error = null
        loadedMonth = null
        competitions = emptyList()
        if (selectedDate?.startsWith(visibleMonth.toString()) != true) selectedDate = null
        try {
            val result = loadCalendarCompetitions(visibleMonth)
            ensureActive()
            competitions = result
            loadedMonth = visibleMonth
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: java.io.IOException) {
            error = "Could not load competition dates. Check your internet connection and retry."
        } catch (failure: Exception) {
            error = failure.message ?: "Could not load competition dates."
        } finally {
            loading = false
        }
    }
    val ready = !loading && error == null && loadedMonth == visibleMonth
    val byDate = remember(competitions) { competitions.groupBy { it.date } }

    Column(Modifier.fillMaxWidth()) {
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton(
                enabled = visibleMonth > startMonth && !state.isScrollInProgress,
                onClick = { scope.launch { state.animateScrollToMonth(visibleMonth.minusMonths(1)) } }
            ) { Icon(Icons.Default.ChevronLeft, "Previous month", tint = CalendarGold) }
            Text(
                text = visibleMonth.format(MonthLabel).uppercase(Locale.ENGLISH),
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            )
            IconButton(
                enabled = visibleMonth < endMonth && !state.isScrollInProgress,
                onClick = { scope.launch { state.animateScrollToMonth(visibleMonth.plusMonths(1)) } }
            ) { Icon(Icons.Default.ChevronRight, "Next month", tint = CalendarGold) }
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth().background(CalendarGold)) {
            listOf("M", "T", "W", "T", "F", "S", "S").forEach { day ->
                Text(day, Modifier.weight(1f).padding(vertical = 10.dp),
                    color = CalendarInk, textAlign = TextAlign.Center,
                    fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        HorizontalCalendar(
            modifier = Modifier.fillMaxWidth().background(CalendarInk),
            state = state,
            dayContent = { day ->
                val inMonth = day.position == DayPosition.MonthDate
                val matches = if (ready && YearMonth.from(day.date) == loadedMonth)
                    byDate[day.date].orEmpty() else emptyList()
                val selected = inMonth && selectedDate == day.date.toString()
                val background = when {
                    !inMonth -> CalendarInk
                    matches.isNotEmpty() -> CalendarGold
                    else -> Color.White
                }
                Box(
                    Modifier.aspectRatio(1f).padding(1.dp)
                        .background(background)
                        .then(if (selected) Modifier.border(2.dp, CalendarInk) else Modifier)
                        .clickable(enabled = inMonth && ready) { selectedDate = day.date.toString() }
                        .semantics {
                            if (inMonth) contentDescription = day.date.format(DateLabel) +
                                if (ready) ", ${matches.size} competitions" else ", dates not loaded"
                        },
                    contentAlignment = Alignment.Center
                ) {
                    if (inMonth) Text(day.date.dayOfMonth.toString(), color = CalendarInk,
                        fontSize = 13.sp,
                        fontWeight = if (matches.isNotEmpty()) FontWeight.Bold else FontWeight.Normal)
                }
            }
        )
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Gold = competition day", color = CalendarMuted,
                modifier = Modifier.weight(1f), fontSize = 13.sp)
            TextButton(enabled = !loading, onClick = { reload++ }) {
                Text("Refresh", color = CalendarGold)
            }
        }
        when {
            loading || (loadedMonth != visibleMonth && error == null) -> {
                LinearProgressIndicator(Modifier.fillMaxWidth(), color = CalendarGold)
                Text("Loading competition dates…", color = CalendarMuted)
            }
            error != null -> Text(error.orEmpty(), color = Color(0xFFFFD1D1))
            ready -> {
                val date = selectedDate?.let { LocalDate.parse(it) }
                if (date == null) {
                    Text(
                        if (competitions.isEmpty()) "No published competitions this month."
                        else "Tap a date to see its competitions. Swipe or use the arrows to change month.",
                        color = CalendarMuted, fontSize = 13.sp
                    )
                } else {
                    Text(date.format(DateLabel), fontWeight = FontWeight.Bold)
                    val selectedCompetitions = byDate[date].orEmpty()
                    if (selectedCompetitions.isEmpty()) {
                        Text("No published competitions on this date.", color = CalendarMuted)
                    }
                    selectedCompetitions.forEach { competition ->
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF171717))
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Text(competition.title, color = Color.White, fontWeight = FontWeight.Bold)
                                if (competition.time.isNotBlank()) Text("Time: ${competition.time}", color = CalendarMuted)
                                if (competition.location.isNotBlank()) Text(competition.location, color = CalendarMuted)
                            }
                        }
                    }
                }
            }
        }
    }
}

private suspend fun loadCalendarCompetitions(month: YearMonth): List<CalendarCompetition> {
    val token = if (SupabaseAuth.isLoggedIn) SupabaseAuth.accessToken() else null
    return withContext(Dispatchers.IO) {
        val results = mutableListOf<CalendarCompetition>()
        var offset = 0
        // Keep fetching until an empty page, including projects with a smaller API row cap.
        while (true) {
            ensureActive()
            val address = SUPABASE_URL.trimEnd('/') + "/rest/v1/events" +
                "?select=id,title,event_date,start_time,location" +
                "&event_type=eq.competition&event_status=eq.published" +
                "&event_date=gte.${month.atDay(1)}" +
                "&event_date=lt.${month.plusMonths(1).atDay(1)}" +
                "&order=event_date.asc,id.asc&limit=200&offset=$offset"
            val connection = URL(address).openConnection() as HttpURLConnection
            val rows = try {
                connection.requestMethod = "GET"
                connection.connectTimeout = 15000
                connection.readTimeout = 15000
                connection.instanceFollowRedirects = false
                connection.setRequestProperty("apikey", SUPABASE_KEY)
                connection.setRequestProperty("Accept", "application/json")
                if (token != null) connection.setRequestProperty("Authorization", "Bearer $token")
                val status = connection.responseCode
                check(status in 200..299) {
                    when (status) {
                        401, 403 -> "Competition dates could not be read with the current permissions (HTTP $status)."
                        else -> "Could not load competition dates (HTTP $status)."
                    }
                }
                JSONArray(connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() })
            } finally {
                connection.disconnect()
            }
            ensureActive()
            if (rows.length() == 0) break
            for (index in 0 until rows.length()) {
                val row = rows.getJSONObject(index)
                val date = runCatching { LocalDate.parse(row.getString("event_date")) }.getOrNull()
                    ?: throw IllegalStateException("A competition has an unreadable date. Ask the content administrator to check it.")
                if (YearMonth.from(date) == month) results.add(CalendarCompetition(
                    id = row.getString("id"),
                    title = row.getString("title"),
                    date = date,
                    time = if (row.isNull("start_time")) "" else row.optString("start_time").take(5),
                    location = if (row.isNull("location")) "" else row.optString("location")
                ))
            }
            offset += rows.length()
        }
        results.distinctBy { it.id }
    }
}
