# WRJA Assistant — what still needs a human

## Facts the assistant currently does NOT have (it says so and hands off to support)
Add these as JSON in `server/data/wrja/` and it will use them immediately:
- Regular class fees / membership cost, gi prices, sibling discounts
- How to enrol or book a trial class; who to contact; phone number, e-mail, office hours, social links
- Class times for Randburg (only "Monday through Saturday" is given), class times by age group
- Whether adult classes exist; the oldest/youngest ages per class
- Term dates, holiday schedule, grading dates, the real login/member-portal URL
- Belt order (the FAQ only says "a belt-ranking system")

## Content to confirm before publishing
- **The three club addresses look like placeholders** ("123 Judo Street", "456 Dojo Avenue", "789 Sensei Road"). Confirm or replace.
- **Randburg's text contradicts the other clubs**: it says all WRJA training takes place there, while Roodepoort and Krugersdorp list their own sessions.
- **Coach bios mention "KJK Judo Club" and "Golden Score Judo", which are not in the club list.** The assistant reports this as written and will not claim a coach teaches at a particular listed club. Clarify the relationship in the data.
- Women's workshop (R100) and grading fee (R200) are the only prices in the data.
- Support link points to `/contact` — change in `MessageBubble.tsx` and `App.tsx` if different.

## Not done / limits
- Replies arrive whole (no word-by-word streaming); a typing indicator covers the 2–6 s model wait.
- The Gemini Interactions API call and model name (`gemini-3.8-flash`) were carried over unchanged from the previous version and could not be exercised live in the build environment; check `GET /api/health` and send a real message after adding your key.
- Sprite sheets for Buddy are still missing (SVG fallback is used).
- Not a deployment into the live WRJA site; adjust to its component conventions.
