import { adminCrud, createRemoteCollection } from "../lib/collections";

export const galleryStore = createRemoteCollection("/api/gallery");
export const adminGalleryStore = createRemoteCollection("/api/admin/gallery");

const crud = adminCrud("/api/admin/gallery", adminGalleryStore);

export const galleryAdmin = {
  async create(item) {
    const saved = await crud.create(item);
    await galleryStore.refresh();
    return saved;
  },
  async update(id, item) {
    const saved = await crud.update(id, item);
    await galleryStore.refresh();
    return saved;
  },
  async remove(id) {
    const result = await crud.remove(id);
    await galleryStore.refresh();
    return result;
  },
};
