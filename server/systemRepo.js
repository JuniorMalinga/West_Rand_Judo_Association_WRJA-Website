import { createUserClient } from "./supabase.js";

function check(error) {
  if (error) throw new Error(error.message || "Supabase request failed.");
}

async function count(client, table, configure = (query) => query) {
  const result = await configure(client.from(table).select("id", { count: "exact", head: true }));
  check(result.error);
  return result.count || 0;
}

export async function adminCounts(accessToken) {
  const client = createUserClient(accessToken);
  const today = new Date().toISOString().slice(0, 10);

  const [
    competitions, events, upcomingEvents, news, users, administrators,
    messages, unreadMessages, payments, pendingPayments,
  ] = await Promise.all([
    count(client, "events", (q) => q.eq("event_type", "competition")),
    count(client, "events"),
    count(client, "events", (q) => q.gte("event_date", today)),
    count(client, "news_posts"),
    count(client, "profiles"),
    count(client, "profiles", (q) => q.eq("profile_role", "administrator")),
    count(client, "contact_messages"),
    count(client, "contact_messages", (q) => q.eq("status", "new")),
    count(client, "payment_proofs"),
    count(client, "payment_proofs", (q) => q.eq("review_status", "submitted")),
  ]);

  return {
    competitions, events, upcomingEvents, news, users,
    members: Math.max(0, users - administrators),
    messages, unreadMessages, payments, pendingPayments,
  };
}

export async function isImageReferenced(urlPath, accessToken) {
  if (!urlPath) return false;
  const client = createUserClient(accessToken);

  const results = await Promise.all([
    client.from("events").select("id", { head: true, count: "exact" }).eq("image_path", urlPath),
    client.from("events").select("id", { head: true, count: "exact" }).eq("qr_code_image_path", urlPath),
    client.from("news_posts").select("id", { head: true, count: "exact" }).eq("image_path", urlPath),
  ]);

  for (const result of results) {
    check(result.error);
    if ((result.count || 0) > 0) return true;
  }
  return false;
}
