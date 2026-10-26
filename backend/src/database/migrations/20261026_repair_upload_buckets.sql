insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  6291456,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
