const DEFAULT_NEWS_CATEGORIES = ["Club news", "Competition"];

export function getNewsCategories(posts = []) {
  return [...new Set([
    ...DEFAULT_NEWS_CATEGORIES,
    ...posts.map((post) => String(post.category || "").trim()).filter(Boolean),
  ])].sort((a, b) => a.localeCompare(b));
}

export function getPublishedNewsCategories(posts = []) {
  return [...new Set(posts.map((post) => String(post.category || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}
