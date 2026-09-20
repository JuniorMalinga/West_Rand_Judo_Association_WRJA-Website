import { supabase } from "../lib/supabaseClient";
import { getPublicMediaUrl } from "./storageService";

// Maps PostgreSQL snake_case fields into the shape expected by the React UI.
function mapNewsPost(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    image: getPublicMediaUrl(row.image_path),
    status: row.post_status,
    publishedAt: row.published_at,
    date: formatPublishedDate(row.published_at),

    // These fields are not currently part of the V1 database contract.
    category: "WRJA News",
    source: null,
    url: null,
    hasVideo: false,
  };
}

function formatPublishedDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function getPublishedNewsPosts() {
  const { data, error } = await supabase
    .from("news_posts")
    .select(`
      id,
      slug,
      title,
      excerpt,
      body,
      image_path,
      post_status,
      published_at
    `)
    .eq("post_status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapNewsPost);
}