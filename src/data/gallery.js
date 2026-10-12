import { adminCrud, createRemoteCollection } from "../lib/collections";
import galleryItems from "./galleryItems";

export const galleryStore = createRemoteCollection("/api/gallery");
export const galleryDeletedPathsStore = createRemoteCollection("/api/gallery/deleted-paths");
export const adminGalleryStore = createRemoteCollection("/api/admin/gallery");

const crud = adminCrud("/api/admin/gallery", adminGalleryStore);

async function refreshPublicGallery() {
  await Promise.all([galleryStore.refresh(), galleryDeletedPathsStore.refresh()]);
}

export const galleryAdmin = {
  async create(item) {
    const saved = await crud.create(item);
    await refreshPublicGallery();
    return saved;
  },
  async update(id, item) {
    const saved = await crud.update(id, item);
    await refreshPublicGallery();
    return saved;
  },
  async remove(id) {
    const result = await crud.remove(id);
    await refreshPublicGallery();
    return result;
  },
};

function normalizePath(path) {
  const value = String(path || "");
  return value.startsWith("public-media/") ? value.slice("public-media/".length) : value;
}

export function combineGalleryItems(managedItems = [], deletedPaths = []) {
  const managed = managedItems.filter((item) => item.photoUrl);
  const byPath = new Map(managed.filter((item) => item.imagePath).map((item) => [normalizePath(item.imagePath), item]));
  const deleted = new Set(deletedPaths.map((item) => normalizePath(typeof item === "string" ? item : item.imagePath)));
  const used = new Set();

  const bundled = galleryItems
    .filter((item) => !deleted.has(normalizePath(item.imagePath)))
    .map((item) => {
      const override = byPath.get(normalizePath(item.imagePath));
      if (!override) return item;
      used.add(override.id);
      return { ...item, ...override };
    });

  const additional = managed.filter((item) => !used.has(item.id));
  return [...bundled, ...additional];
}