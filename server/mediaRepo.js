import { randomUUID } from "crypto";
import { createUserClient } from "./supabase.js";

const BUCKET = "public-media";

const extensionFor = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function check(error, message = "Media request failed.") {
  if (error) throw new Error(`${message} ${error.message || ""}`.trim());
}

export function publicMediaUrl(pathOrUrl, client = null) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("/")) return pathOrUrl;

  const path = pathOrUrl.startsWith(`${BUCKET}/`)
    ? pathOrUrl.slice(BUCKET.length + 1)
    : pathOrUrl;

  const supabase = client;
  if (!supabase) return pathOrUrl;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadPublicImage(preparedImage, accessToken) {
  const client = createUserClient(accessToken);
  const extension = extensionFor[preparedImage.type];
  if (!extension) throw new Error("Unsupported public image type.");

  const storagePath = `admin/${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;
  const { error } = await client.storage.from(BUCKET).upload(storagePath, preparedImage.buffer, {
    contentType: preparedImage.type,
    cacheControl: "3600",
    upsert: false,
  });
  check(error, "Public image upload failed.");

  return {
    path: storagePath,
    url: publicMediaUrl(storagePath, client),
  };
}

export function storagePathFromPublicUrl(value, client) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) {
    if (value.startsWith("/uploads/")) return null;
    return value.startsWith(`${BUCKET}/`) ? value.slice(BUCKET.length + 1) : value;
  }

  const base = client.storage.from(BUCKET).getPublicUrl("").data.publicUrl;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return value.startsWith(prefix) ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export async function deletePublicMedia(value, accessToken) {
  const client = createUserClient(accessToken);
  const path = storagePathFromPublicUrl(value, client);
  if (!path) return false;
  const { error } = await client.storage.from(BUCKET).remove([path]);
  check(error, "Public image cleanup failed.");
  return true;
}
