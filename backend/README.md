# WRJA backend

The backend is the server-side boundary for the WRJA website. It contains the Express API, authentication, validation, uploads, and supporting database and integration modules.

## Layout

- `src/server.js` — Express application setup and local server startup.
- `src/routes/` — API route definitions.
- `src/database/` — SQLite connection, repositories, schema, and migrations.
- `src/integrations/` — Gemini/email/Supabase adapters.
- `src/` — authentication, access control, security middleware, validation, uploads, and seed logic.
- `tests/` — backend API and security tests.
- `knowledge/` — static WRJA knowledge data used by the chatbot.
- `scripts/` — operational scripts such as database reset.

## Commands

From the project root, `npm run dev` starts both the frontend and backend. From this directory, use `npm run dev`, `npm start`, or `npm test`.
