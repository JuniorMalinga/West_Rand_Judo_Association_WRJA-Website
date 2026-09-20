import { supabase } from "../lib/supabaseClient";
import { getPublicMediaUrl } from "./storageService";
import kidsJudo from "../assets/images/Kids/image 91.jpg";
import adultJudo from "../assets/images/Adult/Buff Guy.jpg";
import womensJudo from "../assets/images/Women/image 1.jpg";

const programFields = "id, name, slug, short_description, description, age_group, schedule_text, image_path, display_order";
const fallbackImages = {
  "kids-judo": kidsJudo,
  "adult-judo": adultJudo,
  "womens-judo": womensJudo,
};

// Keep database field names separate from Junior's existing UI shape.
function mapProgram(row) {
  const [highlightWord, ...restWords] = (row.name || "Program").split(" ");

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    highlightWord,
    restWord: restWords.join(" "),
    description: row.description || row.short_description || "",
    shortDescription: row.short_description || "",
    image: getPublicMediaUrl(row.image_path) || fallbackImages[row.slug] || adultJudo,
    bullets: [row.age_group, row.schedule_text].filter(Boolean),
  };
}

export async function getPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select(programFields)
    .eq("is_active", true)
    .order("display_order", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapProgram);
}

export async function getProgramBySlug(slug) {
  const { data, error } = await supabase
    .from("programs")
    .select(programFields)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProgram(data) : null;
}
