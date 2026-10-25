# WRJA Website Assistant

A WRJA-branded website chat widget with a separate optional Buddy guide, backed by a server-side answering API.

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
cp .env.example .env     # then add GEMINI_API_KEY
pnpm dev                 # http://localhost:3000
pnpm check               # typecheck + tests
pnpm build && pnpm start # production-style run
```

**Add `GEMINI_API_KEY`.** Without it the server starts in a basic *offline mode* (it logs a warning, and `/api/health` reports `geminiConfigured: false`). Offline mode is a decent safety net, but the natural, context-aware conversation comes from the model.

## How a conversation works

1. **Every message goes to Gemini with the complete WRJA fact set** (clubs, events, coaches, FAQ — about 6k tokens, so nothing is missed by a retrieval ranking), a detailed persona/rules prompt, today's date, and up to 24 previous turns. Follow-ups like "and the cost?" or "what about Roodepoort?" are resolved by the model from the real conversation.
2. **The reply is checked before the visitor sees it** (`server/services/guard.ts`). Any price, clock time, e-mail address, phone number or web link that isn't in the verified facts (emergency numbers excepted) causes a rejection and one corrected retry; internal wording ("knowledge base", "system prompt") is rejected too. If both attempts fail, or Gemini is down/slow/misconfigured, the visitor gets the offline engine's answer instead — never an error page.
3. **Safety messages never reach the model.** Crisis wording, emergencies, safeguarding concerns and prompt-injection attempts get fixed, reviewed replies (`server/services/fallback.ts`).
4. **Live-event honesty.** The assistant describes the recurring events in `events.json` but cannot see a calendar. Questions about exact dates, registration, payment or member-only events always end with the log-in/contact-support handoff, even if the model forgets.
5. **Follow-up chips.** The model suggests 2–3 next questions; the widget shows them as tappable chips.

The offline engine (no key, outage, rejected reply) understands greetings, thanks, "are you a bot?", "can I speak to a person", fees, how to join, contact details, adults/medical questions, clubs, coaches (by name too), events, belt/FAQ topics, and pronoun follow-ups ("how much is it?" after the women's workshop). It says plainly when it doesn't know.

## Widget

Closed-by-default launcher, expandable panel, quick-start and follow-up chips, **conversation kept across refreshes** (per tab, `sessionStorage` only), **Try again** after a failure, a **new conversation** button, a distinct message when rate-limited, Markdown replies (sanitised), Buddy guide (SVG fallback until sprite sheets are added under `public/assets/wrja-buddy/`).

## Updating what the assistant knows

Every `*.json` file in `server/data/wrja/` is loaded automatically — add `fees.json`, `contact.json`, `how-to-join.json` etc. with entries shaped like the existing ones (`id`, `title`, `category`, `keywords`, `content`). No code change needed. This is the single most effective way to improve answers: see **TODO.md** for the facts the assistant is currently missing.

## Security and limits

API key is server-only and `store: false` is sent so Gemini doesn't retain conversations. The browser sends only the message and bounded history (≤ 2,000 chars/message, ≤ 24 turns, 64 KB body); the server ignores any browser-supplied "facts". Rate limit: 20 requests/IP/minute (set `TRUST_PROXY` behind a proxy). Logs contain short diagnostics only, never message text.

## Tests

`tests/` holds: `guard`, `converse` (scripted fake Gemini: retries, rejections, handoffs, outages, polling, safety routing, spoofing), `fallback` (offline conversations), `api` (validation, rate limiting), `retrieval`, and the widget tests (`chat-ui`, `render`). `legacy/` contains the previous generation's files, kept for reference and not used by the build.
