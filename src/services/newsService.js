import { supabase } from "../lib/supabaseClient";
import { getPublicMediaUrl } from "./storageService";

// Helper to format ISO published_at into a human-readable date
function formatPublishedDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Generate a clean URL-friendly slug from a post title
function generateSlug(title) {
  return (title || "news-post")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Maps PostgreSQL snake_case fields into the shape expected by public React pages
function mapNewsPost(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    imagePath: row.image_path,
    image: getPublicMediaUrl(row.image_path),
    status: row.post_status,
    publishedAt: row.published_at,
    date: formatPublishedDate(row.published_at),
    category: row.category || "WRJA News",
    source: row.source_name,
    url: row.source_url,
    hasVideo: Boolean(row.has_video),
    likes: row.likes_count ?? 0,
    views: row.views_count ?? 0,
    comments: row.comments_count ?? 0,
  };
}

// Maps database row to shape used by AdminNewsPanel
function mapAdminNewsPost(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    body: row.body || "",
    imagePath: row.image_path || "",
    image: getPublicMediaUrl(row.image_path),
    status: row.post_status,
    publishedAt: row.published_at || "",
    date: formatPublishedDate(row.published_at),
    category: row.category || "",
    source: row.source_name || "",
    url: row.source_url || "",
    hasVideo: Boolean(row.has_video),
    likes: row.likes_count ?? 0,
    views: row.views_count ?? 0,
    comments: row.comments_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Fetch published news posts for public NewsPage and homepage NewsSection
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
      published_at,
      category,
      source_name,
      source_url,
      has_video,
      likes_count,
      views_count,
      comments_count
    `)
    .eq("post_status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapNewsPost);
}

// Fetch a single published news post by UUID for NewsDetailPage
export async function getPublishedNewsPostById(id) {
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
      published_at,
      category,
      source_name,
      source_url,
      has_video,
      likes_count,
      views_count,
      comments_count
    `)
    .eq("id", id)
    .eq("post_status", "published")
    .maybeSingle();

  if (error) throw error;

  return mapNewsPost(data);
}

// Fetch all news posts for AdminNewsPanel (RLS permits administrators to view all statuses)
export async function getNewsPostsForAdmin() {
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
      published_at,
      category,
      source_name,
      source_url,
      has_video,
      likes_count,
      views_count,
      comments_count,
      created_at,
      updated_at
    `)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data || []).map(mapAdminNewsPost);
}

// Create a new news post in Supabase
export async function createNewsPost(postData) {
  const slug = postData.slug || generateSlug(postData.title);
  let publishedAt = postData.publishedAt ? new Date(postData.publishedAt).toISOString() : null;

  // If status is published and no date was specified, default to current time
  if (postData.status === "published" && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  const payload = {
    title: postData.title,
    slug,
    excerpt: postData.excerpt || null,
    body: postData.body || "",
    image_path: postData.imagePath || null,
    post_status: postData.status || "draft",
    published_at: publishedAt,
    category: postData.category || null,
    source_name: postData.source || null,
    source_url: postData.url || null,
    has_video: Boolean(postData.hasVideo),
  };

  const { data, error } = await supabase
    .from("news_posts")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapAdminNewsPost(data);
}

// Update an existing news post in Supabase
// Counter values (likes_count, views_count, comments_count) are omitted to preserve them during edits
export async function updateNewsPost(id, postData) {
  let publishedAt = postData.publishedAt ? new Date(postData.publishedAt).toISOString() : null;

  if (postData.status === "published" && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  const payload = {
    title: postData.title,
    excerpt: postData.excerpt || null,
    body: postData.body || "",
    image_path: postData.imagePath || null,
    post_status: postData.status,
    published_at: publishedAt,
    category: postData.category || null,
    source_name: postData.source || null,
    source_url: postData.url || null,
    has_video: Boolean(postData.hasVideo),
  };

  if (postData.slug) {
    payload.slug = postData.slug;
  }

  const { data, error } = await supabase
    .from("news_posts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapAdminNewsPost(data);
}

// Delete a news post by UUID
export async function deleteNewsPost(id) {
  const { error } = await supabase
    .from("news_posts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}