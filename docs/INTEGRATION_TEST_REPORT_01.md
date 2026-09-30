# WRJA Integration Test Report 01
Date: 30 September 2026

## Scope
First combined integration pass after Changes 02–11.

## Passed
- Combined Changes 02–11 can be overlaid onto the supplied main project.
- `server/server.js` starts successfully after the test fixes below.
- `GET /api/health` returned HTTP 200.
- `GET /api/auth/me` without a session returned `{ "user": null }` with HTTP 200.
- Core server JavaScript syntax checks pass.
- Live Supabase has 3 events, 3 news posts, 11 profiles and 30 public-media objects.
- RLS is enabled on profiles, events, news_posts, contact_messages and payment_proofs.
- Only the intended `on_auth_user_created_create_profile` auth trigger remains.
- public-media Storage policies exist for public read and administrator insert/update/delete.
- payment-proofs Storage policies exist for owner/admin access.
- payment-proofs bucket is private, 6 MiB, PDF/JPEG/PNG.
- public-media bucket is public, 4 MiB, JPEG/PNG/WebP/GIF.

## Issues found and fixed
### 1. uploads.js startup ordering
`PUBLIC_UPLOADS` used `__dirname` before `__dirname` had been initialized.
This caused the Node server to stop during module loading.
Fix: initialize `__dirname` immediately after imports before deriving local paths.

### 2. Supabase environment-name compatibility
The supplied project already uses:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The new server helpers originally expected:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Fix: server auth/Supabase helpers now prefer the server names but fall back to the
existing VITE names. No secret values were copied into source code.

## Environment limitation
The isolated test runtime could start the Express server but could not make outbound
network requests from Node to Supabase. Therefore public `/api/competitions` and
`/api/news` requests reached the new repositories but returned `fetch failed` in this
test environment. This is not being marked as an application pass or fail.

Live database/storage verification was performed separately against the actual Supabase
project.

## Still required for full E2E
- Athlete signup/login/session/logout
- Guardian signup/login
- Administrator login and authorization
- Public competitions/news through the local website
- Contact form submit and admin status update
- Payment proof upload/download/approve/reject
- Public media admin upload/edit/delete
- Browser build/run in the developer's normal local environment
- RLS negative tests: non-admin cannot perform admin writes
- Demo/legacy image-path cleanup

## Current result
PARTIAL PASS — architecture and server startup verified; two integration defects were
found and corrected. Network-dependent browser/API flows still require local E2E testing.
