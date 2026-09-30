-- Change 11: align the public-media bucket with server-side upload validation.
update storage.buckets
set
  file_size_limit = 4194304,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
where id = 'public-media';
