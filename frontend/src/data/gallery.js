import { adminCrud, createRemoteCollection } from "../lib/collections";

export const galleryItems = [
  { id: "g1", title: "Training session", category: "training", photoUrl: "/src/assets/images/Logo/wrja-logo.png" },
  { id: "g2", title: "Kids class", category: "kids", photoUrl: "/src/assets/images/Logo/wrja-logo.png" },
  { id: "g3", title: "Club competition", category: "competitions", photoUrl: "/src/assets/images/Logo/wrja-logo.png" },
  { id: "g4", title: "Women on the mat", category: "womens", photoUrl: "/src/assets/images/Logo/wrja-logo.png" },
  { id: "g5", title: "Adult training", category: "adult", photoUrl: "/src/assets/images/Logo/wrja-logo.png" },
  { id: "g6", title: "Club members", category: "training", photoUrl: "/src/assets/images/Logo/wrja-logo.png" },
];

export const galleryStore = createRemoteCollection("/api/gallery");
export const adminGalleryStore = createRemoteCollection("/api/admin/gallery");
export const galleryAdmin = adminCrud("/api/admin/gallery", adminGalleryStore);

export default galleryItems;
