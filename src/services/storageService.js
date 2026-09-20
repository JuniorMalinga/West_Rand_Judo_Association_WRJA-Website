import { supabase } from "../lib/supabaseClient";

// Storage helper used by the data services below.
//
// IMPORTANT FOR THE TEAM:
// The database stores file PATHS (for example "news/post-1.jpg"), not full URLs.
// The frontend converts that stored path into a public Supabase Storage URL here.
// Other pages that use public-media can reuse this same helper.
export function getPublicMediaUrl(path) {
  if (!path) return null;

  // If a full URL is ever stored deliberately, do not try to rebuild it.
  if (/^https?:\/\//i.test(path)) return path;

  const { data } = supabase.storage.from("public-media").getPublicUrl(path);
  return data?.publicUrl || null;
}

// Event documents are stored separately from ordinary public images.
export function getEventDocumentUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const { data } = supabase.storage.from("event-documents").getPublicUrl(path);
  return data?.publicUrl || null;
}
