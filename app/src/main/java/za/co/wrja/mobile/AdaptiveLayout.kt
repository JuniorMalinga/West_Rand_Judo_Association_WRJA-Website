package za.co.wrja.mobile

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

internal val LocalPageWidth = staticCompositionLocalOf { 360.dp }

internal fun pageGutter(width: Dp): Dp = when {
    width < 360.dp -> 12.dp
    width < 600.dp -> 20.dp
    else -> 32.dp
}

internal fun galleryColumns(width: Dp, fontScale: Float): Int = when {
    width >= 700.dp && fontScale <= 1.4f -> 3
    width >= 480.dp || (width >= 300.dp && fontScale <= 1.3f) -> 2
    else -> 1
}
