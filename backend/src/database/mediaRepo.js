import { randomUUID } from "crypto";
import { createAdminClient, createUserClient } from "../integrations/supabase.js";

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

function contentTypeForPath(path) {
  const extension = path.split(".").pop()?.toLowerCase();
  return {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  }[extension] || "application/octet-stream";
}

export async function removePublicMediaWithBackup(value, client = createAdminClient()) {
  const path = storagePathFromPublicUrl(value, client);
  if (!path || path.startsWith("/") || path.split("/").some((part) => part === "..")) {
    throw new Error("The image does not have a valid public-media storage path.");
  }

  const bucket = client.storage.from(BUCKET);
  const { data, error } = await bucket.download(path);
  if (error) {
    if (String(error.statusCode || error.status) === "404" || /not found/i.test(error.message || "")) {
      const missing = new Error("The gallery image was not found in Storage.");
      missing.code = "OBJECT_NOT_FOUND";
      throw missing;
    }
    throw new Error(`Storage download failed: ${error.message || "unknown error"}`);
  }

  const backup = {
    path,
    buffer: Buffer.from(await data.arrayBuffer()),
    contentType: data.type || contentTypeForPath(path),
  };
  if (!backup.buffer.length) throw new Error("Image backup was empty; Storage was not changed.");

  const { error: removeError } = await bucket.remove([path]);
  if (removeError) {
    try {
      await restorePublicMediaBackup(backup, client);
    } catch (restoreError) {
      console.error("Gallery Storage rollback failed.", restoreError.code || restoreError.message);
      throw new Error("Storage deletion failed and the image could not be restored.");
    }
    throw new Error(`Storage deletion failed: ${removeError.message || "unknown error"}`);
  }

  return backup;
}

export async function restorePublicMediaBackup(backup, client = createAdminClient()) {
  if (!backup) return;
  const { error } = await client.storage.from(BUCKET).upload(backup.path, backup.buffer, {
    contentType: backup.contentType,
    cacheControl: "3600",
    upsert: true,
  });
  check(error, "Storage rollback failed.");
}
