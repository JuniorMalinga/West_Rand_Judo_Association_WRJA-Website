# WRJA Buddy

This Buddy is intentionally a quiet page companion. It stays small, perches above the active guided-tour target instead of covering it, reacts briefly to scrolling, and returns to a calm breathing animation. The page content remains the primary focus.

The sprite sheet is decoded before a new animation is painted, preventing a low-quality first-frame flash. Positioning is recalculated on resize and scroll, while the navigation bar and other protected controls remain collision blockers.
