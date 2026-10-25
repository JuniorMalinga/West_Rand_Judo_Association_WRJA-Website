import { adminCrud, createRemoteCollection } from "../lib/collections";

export const galleryStore = createRemoteCollection("/api/gallery");
export const adminGalleryStore = createRemoteCollection("/api/admin/gallery");
export const galleryAdmin = adminCrud("/api/admin/gallery", adminGalleryStore);
