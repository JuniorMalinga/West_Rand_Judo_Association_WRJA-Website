# WRJA Supabase Integration — Change Log 10
Date: 30 September 2026

## Change
Removed the remaining runtime dependency on the legacy SQLite repository from the
migrated Express API and moved dashboard counts/image-reference checks to Supabase.

## Files
- `server/systemRepo.js` — new Supabase repository for dashboard counts and image-reference checks.
- `server/routes/api.js` — no longer imports or calls legacy `repo.js`.
- `server/uploads.js` — local public-upload paths no longer depend on `db.js`.
- `server/server.js` — no longer opens/seeds SQLite or purges legacy SQLite sessions.

## Why
After Changes 03–09, `repo.js` was only still used by the migrated API for administrator
dashboard counts and checking whether a public image was still referenced. Those
operations now query the shared Supabase tables.

## Dashboard mapping
Competitions use `events` filtered to `event_type = competition`; events use `events`;
news uses `news_posts`; users/members use `profiles`; messages use `contact_messages`;
payments use `payment_proofs`.

## SQLite status
The migrated Express runtime no longer needs `repo.js`, `db.js`, `seed.js`, or SQLite
sessions. The old SQLite files are intentionally not deleted yet. They remain as
rollback/reference material until deferred end-to-end tests pass.

## Public uploads
Public site images remain local for now. `uploads.js` owns the public upload directory
directly, so serving an image no longer opens SQLite. Moving public images to
`public-media` remains the next Storage cleanup.

## Security
Dashboard and image-reference queries use the authenticated administrator JWT and RLS.
No service-role key was introduced.

## Verification
Static syntax checks pass. `api.js` has no legacy `repo.*` calls and `server.js` has no
imports of `db.js`, `repo.js`, or `seed.js`. Runtime/E2E testing remains deferred.

## Status
Change 10 code complete. Legacy SQLite runtime dependency removed; legacy files retained
until final integration testing and cleanup approval.
