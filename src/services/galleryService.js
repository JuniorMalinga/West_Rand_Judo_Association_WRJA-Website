import { supabase } from "../lib/supabaseClient";
import { getPublicMediaUrl } from "./storageService";

function mapGalleryItem(row) {
  return {
    id: row.id,
    caption: row.caption || row.title || "WRJA Gallery",
    photoUrl: getPublicMediaUrl(row.image_path),
    // The existing gallery table has no category field.
    category: "all",
  };
}

export async function getGalleryItems() {
  const { data, error } = await supabase
    .from("gallery_items")
    .select("id, title, caption, image_path")
    .eq("is_active", true)
    .order("display_order", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapGalleryItem);
}
