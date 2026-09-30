// Supabase repository for WRJA news posts.
// Keeps Junior's existing camelCase /api/news contract while public.news_posts
// remains the shared PostgreSQL source of truth.
import crypto from "crypto";
import { createPublicClient, createUserClient } from "./supabase.js";
import { publicMediaUrl, storagePathFromPublicUrl } from "./mediaRepo.js";

const newsSelect = `
  id, title, slug, excerpt, body, image_path, post_status, published_at,
  category, source_name, source_url, has_video,
  likes_count, views_count, comments_count, created_at, updated_at
`;

const check = (error) => {
  if (error) throw new Error(`Supabase news query failed: ${error.message}`);
};

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
  : "";

const dateOnly = (value) => value ? String(value).slice(0, 10) : "";

const toNews = (row, client) => row && ({
  id: row.id,
  title: row.title,
  date: formatDate(row.published_at || row.created_at),
  sortDate: dateOnly(row.published_at || row.created_at),
  category: row.category || "",
  excerpt: row.excerpt || "",
  body: row.body || "",
  image: row.image_path ? publicMediaUrl(row.image_path, client) : "/uploads/public/default-news.jpg",
  source: row.source_name || "",
  url: row.source_url || "",
  hasVideo: Boolean(row.has_video),
  likes: row.likes_count || 0,
  views: row.views_count || 0,
  comments: row.comments_count || 0,
});

const slugify = (title) => String(title || "news")
  .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "news";

export async function listNews(accessToken = null) {
  const client = accessToken ? createUserClient(accessToken) : createPublicClient();
  const { data, error } = await client.from("news_posts").select(newsSelect)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  check(error);
  return (data || []).map((row) => toNews(row, client));
}

export async function getNews(id, accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client.from("news_posts")
    .select(newsSelect).eq("id", id).maybeSingle();
  check(error);
  return toNews(data, client);
}

export async function saveNews(news, { create, accessToken }) {
  const client = createUserClient(accessToken);
  const publishedAt = `${news.sortDate}T12:00:00.000Z`;
  const values = {
    title: news.title,
    excerpt: news.excerpt || null,
    body: news.body || "",
    image_path: storagePathFromPublicUrl(news.image, client) || news.image || null,
    category: news.category || null,
    source_name: news.source || null,
    source_url: news.url || null,
    post_status: "published",
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };

  if (create) {
    values.slug = `${slugify(news.title)}-${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await client.from("news_posts")
      .insert(values).select(newsSelect).single();
    check(error);
    return toNews(data, client);
  }

  const { data, error } = await client.from("news_posts").update(values)
    .eq("id", news.id).select(newsSelect).maybeSingle();
  check(error);
  return toNews(data, client);
}

export async function deleteNews(id, accessToken) {
  const { error, count } = await createUserClient(accessToken).from("news_posts")
    .delete({ count: "exact" }).eq("id", id);
  check(error);
  return (count || 0) > 0;
}

export async function isNewsImageReferenced(path, accessToken = null) {
  if (!path) return false;
  const client = accessToken ? createUserClient(accessToken) : createPublicClient();
  const { error, count } = await client.from("news_posts")
    .select("id", { count: "exact", head: true }).eq("image_path", path);
  check(error);
  return (count || 0) > 0;
}
