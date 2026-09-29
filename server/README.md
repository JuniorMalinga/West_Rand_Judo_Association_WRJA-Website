# WRJA server

Express + a local SQLite database. It runs the chatbot **and** the whole site
backend: logins, competitions, events, news, contact messages, proof of payment
and the admin tools.

```bash
npm run dev          # from the project root: starts Vite (5173) and this server (5000)
npm run test:server  # 34 security / API tests against a throw-away database
npm --prefix server run db:reset   # wipe the local database + uploads (asks first)
```

The database file and uploaded images live in `server/data/` (git-ignored). On
first start the server seeds it with the default users, competitions, events and
news. **Default logins are unchanged:** `admin@wrja.co.za / Admin123!` and
`user@wrja.co.za / User123!` (a warning is printed on start-up while the default
admin password is still in use).

Needs Node 22.13+ (uses the built-in `node:sqlite`). On older Node it falls back
to `better-sqlite3` if `npm install` managed to install it.

## Files

| File | Job |
| --- | --- |
| `server.js` | Express app, middleware order, chatbot, static files |
| `routes/api.js` | Every API route + who is allowed to call it |
| `repo.js` | **All SQL lives here.** Async functions returning plain objects |
| `schema.sql` | Table definitions (portable SQL) |
| `auth.js` | scrypt password hashing, server sessions, `requireAuth` / `requireAdmin` |
| `security.js` | Headers, CORS allow-list, CSRF guard, rate limiter, error handler |
| `validate.js` | Input validation for every field |
| `uploads.js` | Image / PDF checks (file signature, size, random names) |
| `seed.js` | Starting content |

## Security model (what stops bypassing)

* Login is a **server session** in an `HttpOnly`, `SameSite=Lax` cookie. The
  browser stores nothing that says who you are, so editing `localStorage` or the
  React code can't make you an admin. The role is re-read from the database on
  every request, so demoting or deleting someone takes effect immediately.
* Every `/api/admin/*` route is behind `requireAdmin` on the **server**. The
  React route guards are only for a smoother experience.
* Passwords are hashed with scrypt (never stored or logged in plain text).
  8+ characters with a letter and a number. Admin sessions last 8 hours,
  members 7 days. Changing a password or role signs that person out everywhere.
* Login is rate-limited (5 failures per email / 20 per IP per 15 min) and
  "wrong password" and "unknown email" look identical. Contact form, sign-up,
  uploads and chat are rate-limited too; the contact form has a honeypot.
* State-changing requests need the `X-Requested-With: wrja-web` header and an
  allowed origin (CSRF). CORS only allows known origins (`ALLOWED_ORIGINS` in
  `.env.local` adds more). No request bodies are logged.
* Uploads are checked by real file signature, size-capped and saved under
  random names; SVG/HTML is refused. Proof-of-payment files are **private**:
  only the uploader and admins can open them.
* Visitors who aren't logged in only get a teaser of each competition
  (no registration link or payment details) and can't read events at all.
* Every query uses bound parameters (no string-built SQL).

Still to do before going live: change the default passwords, serve over HTTPS
(set `NODE_ENV=production` so the cookie is `Secure`; set `TRUST_PROXY=true`
behind a reverse proxy), and back up `server/data/`.

## Moving to Supabase later

The rest of the server only talks to `repo.js`, `uploads.js` and `auth.js`:

1. Create the tables from `schema.sql` in Supabase (use `bigint generated always
   as identity` for the two `AUTOINCREMENT` ids and `timestamptz` for dates).
2. Rewrite `repo.js` with `@supabase/supabase-js`, keeping each function's name,
   arguments and return shape – the routes don't change.
3. Point `uploads.js` at Supabase Storage (a public bucket for site images, a
   **private** bucket for proof of payment) and keep the validation.
4. Either keep this server-side session login, or switch to Supabase Auth and
   replace `attachUser` in `auth.js`.
5. Turn on Row Level Security for the tables as a second line of defence.
