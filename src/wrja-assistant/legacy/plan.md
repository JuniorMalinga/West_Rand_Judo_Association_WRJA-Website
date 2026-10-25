# Askwise — Implementation Plan

## Approved scope and architecture

Askwise is a local-first React chatbot with an editable, user-supplied JSON knowledge base and optional Gemini assistance. Use React + Vite + TypeScript for the browser, Node.js + Express + TypeScript for the API, and a single same-origin Express listener on the configured Preview port (3000). In development, Express mounts Vite in middleware mode; in production, it serves the built React assets. This avoids extra proxy/port configuration while keeping UI and API modules separated.

The starter knowledge base lives in a versioned JSON file. On first use, the browser seeds it into local storage; user imports, edits and deletes are saved in that browser profile. The UI supports importing a structured JSON file, inspecting and editing entries, deleting entries, exporting the current collection, and restoring the sample dataset. Uploaded knowledge is not silently sent anywhere: only selected relevant excerpts are included in an API request when the assistant uses Gemini. Explain that browser-local content is not synchronized across devices and can be moved with export/import.

Each knowledge entry has a stable ID, title, category, keywords, related terms, question examples, answer, and optional source/notes. Retrieval normalizes text, recognizes configured related terms/synonyms, scores phrase and token overlap with lightweight IDF/term weighting, and uses recent conversation turns to reformulate short follow-ups before searching. It returns ranked matches with confidence and source references. Only high-confidence local matches are presented as verified local answers. Short/ambiguous follow-ups can use prior user and assistant turns to resolve their referent; low-confidence matches must not be stated as fact.

The chat client retains the current conversation and sends bounded recent history plus a small number of relevant knowledge excerpts to Express only for a Gemini request. The server validates request size and shape, applies a basic in-memory rate limit, sets an upstream timeout, and calls Gemini with instructions to preserve local facts and distinguish unsupported claims. Missing key, provider/network errors, or timeout produce a useful honest limitation or the best local fallback. Keep credentials exclusively in server environment variables; include only placeholders in `.env.example`.

## Gemini integration contract

As checked against Google's official documentation on 2026-10-23, new text-generation examples use the Gemini Interactions API and the model guide lists `gemini-3.8-flash` as a stable model. Send a server-side `POST` to `https://generativelanguage.googleapis.com/v1beta/interactions` with `Content-Type: application/json`, `x-goog-api-key`, a configurable model name, `input`, and a system instruction. Include a bounded transcript and relevant knowledge snippets in the input. Set `store: false` to avoid retaining these interaction records; use stateless full-context requests rather than provider-side conversation IDs. Read model text from the API response text output. Set `thinking_level` to `low` for ordinary chat latency and use a 20-second server timeout; both settings remain configurable. Allow `GEMINI_MODEL` to override the default because provider/account availability can vary.

Official references: [Interactions API](https://ai.google.dev/gemini-api/docs/interactions), [text generation](https://ai.google.dev/gemini-api/docs/text-generation), and [Gemini models](https://ai.google.dev/gemini-api/docs/models/gemini).

## User interface and design

Three low-probability style candidates considered: Quiet editorial workbench (0.04), Warm paper archive (0.07), and Signal-console minimalism (0.09). Choose **Quiet editorial workbench**.

- **Design movement:** Contemporary editorial software design—precise typography, deliberate whitespace, subtle rules, and restrained color.
- **Core principles:** Calm over flashy; answer first and evidence close by; make knowledge editable and inspectable; keep every state understandable.
- **Color philosophy:** Warm near-white surfaces and deep ink give reading comfort; a distinctive verdigris accent identifies Askwise actions and source confidence without suggesting certainty where none exists.
- **Layout paradigm:** A compact left rail for chat/knowledge-base modes and a broad conversation canvas; on smaller screens the rail collapses into a top switcher. Evidence appears adjacent to each answer rather than in a detached dashboard.
- **Signature elements:** A small bracketed “A” wordmark; fine editorial divider lines; compact source chips with numbered references.
- **Interaction philosophy:** Import and send actions are explicit; show processing stage and answer provenance; never hide uncertainty or silently replace the user's knowledge.
- **Animation:** Short, low-amplitude fades and slide transitions for new messages and panels; respect reduced-motion preferences; no looping decorative motion.
- **Typography system:** Use a highly legible sans-serif for UI and a restrained serif display face for editorial headings; keep body text and imported knowledge in a comfortably readable measure.
- **Brand essence:** A careful assistant that makes personal reference knowledge easy to use; clear, grounded, adaptable.
- **Brand voice:** Direct and thoughtful. Example lines: “Here’s what your notes say.” “I couldn’t verify that from this knowledge base.”
- **Wordmark & logo:** A custom inline monogram made from an open bracket and an “A” stroke, paired with a purpose-drawn wordmark treatment rather than an off-the-shelf logo image.
- **Signature brand color:** Verdigris, used sparingly for active navigation, local-answer provenance, and primary actions.

## Project structure

```text
askwise/
├── client/
│   ├── index.html
│   └── src/
│       ├── components/       # Knowledge-base manager and chat message renderer
│       ├── lib/              # Browser knowledge persistence and same-origin API client
│       ├── App.tsx           # Conversation state, local-first routing, chat shell
│       ├── main.tsx
│       └── styles.css        # Responsive design system
├── server/
│   ├── api/chat.ts           # Validated, rate-limited chat endpoint
│   ├── data/knowledge-base.json
│   ├── services/             # Context, retrieval, decision pipeline, Gemini, shared types
│   └── index.ts              # Express + Vite dev middleware / production static serving
├── tests/                    # Retrieval, API, import, UI interaction, and render tests
├── public/
│   ├── askwise-logo.svg
│   └── manus-routes.json
├── .env.example
├── .gitignore
├── app.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig*.json
├── vite.config.ts
├── README.md
├── plan.md
└── TODO.md
```

## Dependencies and operational boundaries

Use a pinned pnpm toolchain with an explicit lifecycle-script policy before installing dependencies. Keep dependencies focused: React, Vite, Express, TypeScript, a TS execution tool for development, Vitest, and small DOM test tools. Use native server-side `fetch` for Gemini to avoid extra SDK surface. Do not configure a managed database: the approved initial knowledge storage is browser-local with a sample JSON seed. Provide `.env.example` for `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_THINKING_LEVEL`, timeout, and port, never real credentials.

The application is a single-page web app. Declare `/` in the route manifest; API and health paths are not pages. Do not enable publication or auto-publish as part of this implementation. Keep browser-facing paths relative for Preview.
