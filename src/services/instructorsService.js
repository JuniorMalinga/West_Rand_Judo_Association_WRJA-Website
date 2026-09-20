import { supabase } from "../lib/supabaseClient";
import { getPublicMediaUrl } from "./storageService";
import instructorMetadata from "../data/instructors";
import fallbackImage from "../assets/images/team/image 79.jpg";

function mapInstructor(row) {
  // Preserve existing links and quotes, which have no fields in the backend contract.
  const metadata = instructorMetadata.find((item) => item.slug === row.slug);

  return {
    id: row.id,
    slug: row.slug,
    name: [row.first_name, row.last_name].filter(Boolean).join(" "),
    role: row.rank || "WRJA Instructor",
    image: getPublicMediaUrl(row.image_path) || metadata?.image || fallbackImage,
    excerpt: row.qualifications || row.specialisations || "",
    bio: row.bio ? row.bio.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean) : [],
    social: metadata?.social || [],
    quote: metadata?.quote || "",
  };
}

export async function getInstructors() {
  const { data, error } = await supabase
    .from("instructors")
    .select("id, first_name, last_name, slug, rank, bio, qualifications, specialisations, image_path")
    .eq("is_active", true)
    .order("display_order", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapInstructor);
}
