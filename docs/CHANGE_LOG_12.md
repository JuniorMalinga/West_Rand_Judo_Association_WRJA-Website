# WRJA Supabase Integration — Change Log 12
Date: 30 September 2026

## Change
Audited every non-null image reference in the live WRJA content tables against the
actual objects currently stored in the `public-media` bucket.

## Contract confirmed
Database media fields should store the object path relative to the bucket, for example:
`gallery/Adult 1.jpg`

They should not store:
- `public-media/gallery/Adult 1.jpg`
- an invented path to a different image

## Confirmed correction applied
One gallery row stored:
`public-media/gallery/Adult 1.jpg`

The actual Storage object is:
`gallery/Adult 1.jpg`

That row has been normalized in the live database. Verification confirms the corrected
path now resolves to an existing Storage object.

## Audit result
16 live database image references were checked:
- 4 gallery references now match Storage objects.
- 12 demo references do not currently have matching objects in `public-media`.

The 12 unresolved references belong to:
- 3 events
- 3 instructors
- 3 news posts
- 3 programs

## Why the other 12 were not changed
There is no reliable one-to-one evidence showing which existing Storage image belongs
to each demo record. Assigning a visually plausible image would invent backend data and
could associate the wrong person/content with a record.

Those rows are therefore documented as unresolved rather than silently rewritten.

## Required resolution
For each unresolved demo record, either:
1. upload the intended image using the existing database path; or
2. provide/confirm the correct existing Storage object and update the database path.

This is content/seed-data cleanup, not a schema problem.

## Files
- `database/migrations/20260930_normalize_public_media_paths.sql`
- `docs/PUBLIC_MEDIA_REFERENCE_AUDIT.csv`
- `docs/CHANGE_LOG_12.md`

## Database impact
No schema changes.
One confirmed data correction in `gallery_items`.
No demo records deleted.
No Storage objects deleted or renamed.

## Verification
The live database-to-Storage audit was rerun after the migration. All four gallery
references resolve successfully. The remaining 12 missing references remain explicitly
identified in the audit matrix.

## Status
Change 12 safe consistency cleanup complete.
Known resolvable mismatch: FIXED.
Unresolved demo-image content mappings: DOCUMENTED, awaiting real source images or
confirmed mappings.
