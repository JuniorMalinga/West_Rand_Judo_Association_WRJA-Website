# WRJA Buddy

This Buddy is intentionally a quiet page companion. It stays small, perches above the active guided-tour target instead of covering it, reacts briefly to scrolling, and returns to a calm breathing animation. The page content remains the primary focus.

The sprite sheet is decoded before a new animation is painted, preventing a low-quality first-frame flash. Positioning is recalculated on resize and scroll, while the navigation bar and other protected controls remain collision blockers.

During a guided tour, progress and Buddy’s current message are saved across page refreshes. Using the close button explicitly closes Buddy and clears the saved tour. **Skip** skips the current page and continues to the next tour page; it cannot bypass sign-up or sign-in, where Buddy asks the visitor to log in or sign up before continuing. The tour order is Home, About, Gallery, FAQ, Instructors, News, Contact, sign-up, then the members’ Events hub. After successful sign-up Buddy sends the visitor to sign in, then resumes at Events and finishes there.
