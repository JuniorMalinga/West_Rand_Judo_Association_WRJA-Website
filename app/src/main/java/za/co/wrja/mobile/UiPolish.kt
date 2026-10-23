package za.co.wrja.mobile

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/** Shared visual primitives for the app's dark, gold WRJA identity. */
internal val WrjaGold = Color(0xFFF1BD16)
internal val WrjaCard = Color(0xFF171717)
internal val WrjaCardBorder = Color(0xFF393939)
internal val WrjaMuted = Color(0xFFA6A6A6)

@Composable
internal fun Modifier.wrjaReveal(index: Int = 0): Modifier {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0f,
        animationSpec = tween(durationMillis = 380, delayMillis = (index.coerceAtMost(8) * 45)),
        label = "content alpha"
    )
    val translateY by animateFloatAsState(
        targetValue = if (visible) 0f else 22f,
        animationSpec = tween(durationMillis = 420, delayMillis = (index.coerceAtMost(8) * 45)),
        label = "content lift"
    )
    return graphicsLayer(alpha = alpha, translationY = translateY)
}

@Composable
internal fun WrjaContentCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = WrjaCard),
        border = BorderStroke(1.dp, WrjaCardBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 7.dp, pressedElevation = 2.dp),
        content = content
    )
}

@Composable
internal fun WrjaSectionHeading(
    eyebrow: String,
    title: String,
    description: String? = null,
    modifier: Modifier = Modifier
) {
    androidx.compose.foundation.layout.Column(modifier.fillMaxWidth()) {
        Text(
            text = eyebrow.uppercase(),
            color = WrjaGold,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.ExtraBold
        )
        Spacer(Modifier.height(7.dp))
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        if (!description.isNullOrBlank()) {
            Spacer(Modifier.height(7.dp))
            Text(description, color = WrjaMuted, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
