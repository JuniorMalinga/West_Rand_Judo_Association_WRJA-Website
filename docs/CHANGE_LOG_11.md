# WRJA Supabase Integration — Change Log 11
Date: 30 September 2026

## Change
Moved new administrator public-image uploads from local server disk to the existing
Supabase Storage `public-media` bucket.

## Files changed
- `server/mediaRepo.js` — new public-media Storage repository.
- `server/uploads.js` — retains signature/size validation; no longer writes dynamic public images to disk.
- `server/routes/api.js` — admin upload and image cleanup now use Supabase Storage.
- `database/migrations/20260930_public_media_upload_limits.sql` — bucket limits aligned to application validation.

## Live Storage review
The existing `public-media` bucket was confirmed PUBLIC and already contained about
30 WRJA image objects. Existing policies already enforce:
- public/anonymous read
- administrator-only insert
- administrator-only update
- administrator-only delete

No duplicate Storage policies were added.

## Bucket hardening
The bucket previously had no file-size or MIME restrictions at bucket level.
Change 11 applies:
- maximum object size: 4 MiB
- allowed types: JPEG, PNG, WebP, GIF

This matches the existing server validation and provides defence in depth.

## Upload flow
Admin image -> Express signature/size validation -> authenticated admin JWT ->
`public-media/admin/<year>/<random UUID>.<extension>` -> public Storage URL returned
to the unchanged React admin UI.

The browser does not receive a service-role key.

## Cleanup
When an event/news image is replaced or its record is deleted, the API first checks
whether another Supabase record still references it. If not, Storage cleanup removes
the object. Legacy `/uploads/public/...` seed/default paths are ignored by Storage cleanup.

## Existing data finding
The live database contains several relative demo image paths such as
`events/demo/...`, `news/demo/...`, `programs/demo/...` and `instructors/demo/...`
that do not correspond to the currently listed objects in `public-media`.
This change does NOT invent replacements or silently rewrite those records.
They should be handled as seed/demo-data cleanup during integration testing.

One gallery row also uses the prefix `public-media/gallery/...` while most gallery
rows use `gallery/...`. That inconsistency is recorded for data cleanup rather than
being silently changed here.

## Legacy local assets
Built-in seed/default images can still be served from `/uploads/public` for compatibility.
New dynamic admin uploads no longer depend on local disk. Removing the legacy static
route/assets should happen only after final data verification confirms no records use them.

## Database migration
No public application table changed. Only Storage bucket configuration changed.

## Verification
- Live bucket and object policies reviewed.
- Bucket limits applied live.
- JavaScript syntax checks completed.
- Full browser upload/edit/delete E2E testing remains deferred.

## Status
Change 11 implementation complete. New public uploads use Supabase Storage; legacy
static assets are retained temporarily for compatibility.

## Post-change integration test
Test Report 01 found and corrected two integration issues: `__dirname` initialization order in `uploads.js` and compatibility with the project's existing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` environment names.
