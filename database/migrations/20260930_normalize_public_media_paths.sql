-- Change 12: normalize the one confirmed malformed public-media database path.
-- Store object paths relative to the bucket; do not store the bucket name itself.

update public.gallery_items
set
  image_path = 'gallery/Adult 1.jpg',
  updated_at = now()
where id = '41b9745c-7992-47a6-b6b5-e8a310d9b77f'
  and image_path = 'public-media/gallery/Adult 1.jpg';
