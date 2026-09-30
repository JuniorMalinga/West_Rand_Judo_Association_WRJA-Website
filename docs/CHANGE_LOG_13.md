# Change 13 — Public Media URL Contract Fix

## Problem
Supabase rows correctly stored bucket-relative `public-media` paths, but the Express API returned
those raw paths to React. Existing React components use the returned value directly in `<img src>`,
so valid Storage objects still rendered as broken images.

## Fix
- `server/newsRepo.js`
  - Converts bucket-relative `image_path` values to Supabase public URLs when reading.
  - Converts Supabase public URLs back to bucket-relative paths before saving.
- `server/eventsRepo.js`
  - Applies the same conversion to event/competition images and QR images.
  - Also restores the missing `crypto` import used by event creation.

## Contract
PostgreSQL continues to store portable bucket-relative paths such as:
`News/example.jpg`

The React API receives a browser-usable public URL.

This keeps PostgreSQL suitable as the shared contract for both React and Kotlin.

## Not changed
Missing Storage binaries are not disguised or replaced. Instructor/program assets that have not
yet been uploaded remain a separate content-storage task.
