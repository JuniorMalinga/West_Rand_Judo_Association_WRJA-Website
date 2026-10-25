import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_SCHOOL_IMAGE = "/src/assets/images/Logo/wrja-logo.png";

export const schoolsStore = createRemoteCollection("/api/schools");
export const schoolsAdmin = adminCrud("/api/admin/schools", schoolsStore);
