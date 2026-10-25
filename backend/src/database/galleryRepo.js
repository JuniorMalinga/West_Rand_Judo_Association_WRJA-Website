import { createAdminClient, createPublicClient, createUserClient } from "../integrations/supabase.js";
import { publicMediaUrl, removePublicMediaWithBackup, restorePublicMediaBackup, storagePathFromPublicUrl } from "./mediaRepo.js";
import { HttpError } from "../security.js";

const TABLE = "gallery_items";
const SELECT = "id, title, caption, category, image_path, display_order, created_at, updated_at";
const ADMIN_UPLOAD_PATH = /^admin\/\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp|gif)$/i;
const LEGACY_GALLERY_FILE = /^[A-Za-z0-9][A-Za-z0-9 _().-]{0,179}\.(?:jpe?g|png|webp|gif)$/i;
const LEGACY_GALLERY_DIRECTORY = /^[A-Za-z0-9][A-Za-z0-9 _()-]{0,79}$/;
const GALLERY_ITEM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeGalleryStoragePath(path) {
  const value = String(path || "");
  return value.startsWith("public-media/") ? value.slice("public-media/".length) : value;
}

export function isManagedGalleryUploadPath(path) {
  return ADMIN_UPLOAD_PATH.test(normalizeGalleryStoragePath(path));
}

export function isGalleryItemId(value) {
  return GALLERY_ITEM_ID.test(String(value || ""));
}

export function isLegacyGalleryPath(path) {
  const normalized = normalizeGalleryStoragePath(path);
  const parts = normalized.split("/");
  if (parts[0] !== "gallery" || parts.length < 2) return false;
  const filename = parts.at(-1);
  return parts.slice(1, -1).every((part) => LEGACY_GALLERY_DIRECTORY.test(part))
    && LEGACY_GALLERY_FILE.test(filename);
}

function check(error) {
  if (error) {
    const failure = new Error(`Supabase gallery query failed: ${error.message}`);
    failure.code = error.code;
    failure.status = error.status;
    throw failure;
  }
}

function storedPath(value, client) {
  return normalizeGalleryStoragePath(storagePathFromPublicUrl(value, client) || value);
}

function inferCategory(text) {
  const value = String(text || "").toLowerCase();
  if (/\bwomen|ladies|female\b/.test(value)) return "womens";
  if (/\bkid|child|children|junior|youth\b/.test(value)) return "kids";
  if (/\bcompetition|tournament|championship|medal|match\b/.test(value)) return "competitions";
  if (/\badult|senior\b/.test(value)) return "adult";
  return "training";
}

export function toGalleryItem(row, client) {
  const imagePath = storedPath(row.image_path, client);
  const caption = String(row.title || row.caption || "Judo training").trim() || "Judo training";
  // Existing rows may use caption as the descriptive text; if it is absent,
  // use the title as accessible alt text rather than querying a nonexistent column.
  const altText = String(row.caption || row.title || caption).trim();
  return {
    id: row.id,
    category: row.category || inferCategory(`${row.title || ""} ${row.caption || ""}`),
    caption,
    altText,
    displayOrder: Number.isInteger(row.display_order) ? row.display_order : 100,
    imagePath,
    photoUrl: row.image_path ? publicMediaUrl(row.image_path, client) : "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function checkedImagePath(photoUrl, client, { create, existingPath }) {
  const path = storedPath(photoUrl, client);
  if (isManagedGalleryUploadPath(path)) return path;
  if (!create && path === existingPath && isLegacyGalleryPath(path)) return path;
  throw new HttpError(400, "Use the admin image uploader for new photos; existing gallery files can only be retained on their current record.");
}

export async function listGallery(accessToken = null) {
  const client = accessToken ? createUserClient(accessToken) : createPublicClient();
  const { data, error } = await client.from(TABLE).select(SELECT)
    .order("display_order", { ascending: true }).order("created_at", { ascending: false });
  check(error);
  return (data || []).map((row) => toGalleryItem(row, client));
}

export async function listDeletedGalleryPaths() {
  const client = createPublicClient();
  const { data, error } = await client.rpc("wrja_deleted_gallery_paths");
  check(error);
  return (data || [])
    .map((row) => normalizeGalleryStoragePath(typeof row === "string" ? row : row.image_path))
    .filter((path) => path.startsWith("gallery/"));
}

export async function getGalleryItem(id, accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client.from(TABLE).select(SELECT).eq("id", id).maybeSingle();
  check(error);
  return data ? toGalleryItem(data, client) : null;
}

export async function saveGalleryItem(item, { create, accessToken }) {
  const client = createUserClient(accessToken);
  let existingPath = null;

  if (!create) {
    const { data, error } = await client.from(TABLE).select("image_path").eq("id", item.id).maybeSingle();
    check(error);
    if (!data) throw new HttpError(404, "Gallery image not found.");
    existingPath = storedPath(data.image_path, client);
  }

  const imagePath = checkedImagePath(item.photoUrl, client, { create, existingPath });
  const values = {
    image_path: imagePath,
    title: item.caption,
    caption: item.altText || item.caption,
    category: item.category,
    display_order: item.displayOrder,
  };
  const query = create
    ? client.from(TABLE).insert(values)
    : client.from(TABLE).update(values).eq("id", item.id);
  const { data, error } = await query.select(SELECT).maybeSingle();
  check(error);
  if (!data) throw new HttpError(404, "Gallery image not found.");
  return toGalleryItem(data, client);
}

export async function deleteGalleryItem(id, item, {
  accessToken,
  storageClient = createAdminClient(),
  databaseClient = accessToken ? createUserClient(accessToken) : null,
} = {}) {
  if (!isGalleryItemId(id)) {
    throw new HttpError(400, "Gallery image ID is invalid.");
  }
  if (!item || typeof item.imagePath !== "string") {
    throw new HttpError(400, "Gallery image path is invalid.");
  }
  if (!databaseClient) throw new HttpError(401, "Please log in to continue.");

  const imagePath = normalizeGalleryStoragePath(item.imagePath);
  const isLegacy = isLegacyGalleryPath(imagePath);
  if (!isLegacy && !isManagedGalleryUploadPath(imagePath)) {
    throw new HttpError(400, "Gallery image path is invalid.");
  }

  let backup;
  try {
    // Keep a server-side copy so a failed row deletion can restore the object.
    backup = await removePublicMediaWithBackup(imagePath, storageClient);
  } catch (error) {
    console.error("Gallery Storage deletion failed.", error.code || error.statusCode || "storage_error");
    throw new HttpError(424, "The image file could not be removed from Storage. The gallery entry was left unchanged.");
  }

  let deleted = false;
  try {
    // Preserve auth.uid() so the database RPC can enforce its own admin check.
    const { data, error } = await databaseClient.rpc("wrja_delete_gallery_item", { item_id: id });
    check(error);
    deleted = Boolean(data);
  } catch (error) {
    try {
      await restorePublicMediaBackup(backup, storageClient);
    } catch (restoreError) {
      console.error("Gallery deletion rollback failed.", {
        galleryId: id,
        databaseError: error.code || error.status || "database_error",
        restoreError: restoreError.code || restoreError.status || "storage_error",
      });
      throw new HttpError(500, "Deletion could not be completed safely. Contact an administrator before retrying.");
    }
    console.error("Gallery database deletion failed; Storage image restored.", error.code || error.status || "database_error");
    if (error instanceof HttpError) throw error;
    if (error.code === "42501" || error.status === 403) {
      throw new HttpError(403, "You don't have permission to delete this gallery image.");
    }
    if (error.status === 401 || error.code === "PGRST301") {
      throw new HttpError(401, "Please log in to continue.");
    }
    throw new HttpError(424, "The gallery entry could not be removed. Its image was restored to Storage.");
  }

  if (!deleted) {
    try {
      await restorePublicMediaBackup(backup, storageClient);
    } catch (restoreError) {
      console.error("Gallery image rollback failed after its database row changed.", {
        galleryId: id,
        restoreError: restoreError.code || restoreError.status || "storage_error",
      });
      throw new HttpError(500, "The gallery record changed during deletion and its image could not be restored. Contact an administrator.");
    }
    return { deleted: false, orderUpdated: true };
  }

  let orderUpdated = true;
  try {
    const { data, error } = await storageClient.from(TABLE).select("id")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    check(error);
    for (const [index, row] of (data || []).entries()) {
      const { error: updateError } = await storageClient.from(TABLE)
        .update({ display_order: index + 1 }).eq("id", row.id);
      check(updateError);
    }
  } catch (error) {
    orderUpdated = false;
    console.error("Gallery deletion succeeded but order refresh failed.", error.code || error.status || "database_error");
  }

  return { deleted: true, orderUpdated };
}

export async function isGalleryImageReferenced(path, accessToken = null, exceptId = null) {
  if (!path) return false;
  const client = accessToken ? createUserClient(accessToken) : createPublicClient();
  let query = client.from(TABLE).select("id", { count: "exact", head: true }).eq("image_path", path);
  if (exceptId) query = query.neq("id", exceptId);
  const { error, count } = await query;
  check(error);
  return (count || 0) > 0;
}
