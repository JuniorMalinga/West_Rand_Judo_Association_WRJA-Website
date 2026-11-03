// Server-only FCM HTTP v1 sender. Supabase remains the content database.
import { createSign } from "node:crypto";

const TOPIC = "wrja-public-updates";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
let cachedToken = null;
let tokenRequest = null;

export function buildPublicationMessage(kind, item) {
  if (!["event", "news"].includes(kind)) throw new Error("Unsupported publication type");
  const id = String(item.id || "");
  const title = String(item.title || item.name || "WRJA update").trim();
  if (!id || !title) throw new Error("Publication ID and title are required");
  const headings = kind === "news"
    ? ["New WRJA news", "Nuwe WRJA-nuus", "Izindaba ezintsha ze-WRJA"]
    : ["New WRJA event", "Nuwe WRJA-geleentheid", "Umcimbi omusha we-WRJA"];
  const body = `${title}${kind === "event" && item.date ? ` · ${item.date}` : ""}`.slice(0, 300);
  return {
    topic: TOPIC,
    // Data messages let Android select its saved language in foreground/background.
    // Content titles are user-authored and are not automatically translated.
    data: {
      type: kind, publication_id: id, title: headings[0], body,
      title_en: headings[0], title_af: headings[1], title_zu: headings[2],
      body_en: body, body_af: body, body_zu: body,
    },
    android: { priority: "high", ttl: "86400s" },
  };
}

function credentials(env) {
  if (env.FCM_NOTIFICATIONS_ENABLED !== "true") return null;
  const projectId = String(env.FIREBASE_PROJECT_ID || "").trim();
  const email = String(env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = String(env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!/^[a-z][a-z0-9-]{4,62}$/.test(projectId) || !email.endsWith(".gserviceaccount.com") || !privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("FCM server configuration is incomplete");
  }
  return { projectId, email, privateKey };
}

async function accessToken(config, fetchImpl) {
  const identity = `${config.projectId}:${config.email}`;
  if (cachedToken?.identity === identity && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  if (tokenRequest) return tokenRequest;
  tokenRequest = (async () => {
    const now = Math.floor(Date.now() / 1000);
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
      iss: config.email, scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: TOKEN_URL, iat: now, exp: now + 3600,
    })}`;
    const signature = createSign("RSA-SHA256").update(unsigned).end().sign(config.privateKey, "base64url");
    const response = await fetchImpl(TOKEN_URL, {
      method: "POST", signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
    });
    if (!response.ok) throw new Error("FCM OAuth failed");
    const token = await response.json();
    if (!token.access_token) throw new Error("FCM OAuth token missing");
    cachedToken = { identity, value: token.access_token, expiresAt: Date.now() + Number(token.expires_in || 3600) * 1000 };
    return cachedToken.value;
  })();
  try { return await tokenRequest; } finally { tokenRequest = null; }
}

// Awaited within the Vercel request, never fire-and-forget after res.json().
// A push failure must not turn a successfully saved publication into an HTTP
// failure (which could cause the administrator to create a duplicate record).
export async function notifyPublication(kind, item, { env = process.env, fetchImpl = fetch, logger = console } = {}) {
  try {
    const config = credentials(env);
    if (!config) return { status: "disabled" };
    const token = await accessToken(config, fetchImpl);
    const response = await fetchImpl(`https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`, {
      method: "POST", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: buildPublicationMessage(kind, item) }),
    });
    if (!response.ok) {
      if (response.status === 401) cachedToken = null;
      throw new Error("FCM send rejected");
    }
    const result = await response.json();
    if (!result.name) throw new Error("FCM acknowledgement missing");
    return { status: "accepted", messageId: result.name };
  } catch (_) {
    // Never log OAuth assertions, keys, tokens, or raw responses.
    logger.warn("FCM publication notification failed; publication remains saved.", { kind, id: String(item?.id || "") });
    return { status: "failed" };
  }
}

/** Keeps the database write and notification ordering testable without network. */
export async function saveAndNotify(kind, save, notify = notifyPublication) {
  const item = await save();
  let notification;
  try { notification = await notify(kind, item); }
  catch (_) { notification = { status: "failed" }; }
  return { item, notification };
}
