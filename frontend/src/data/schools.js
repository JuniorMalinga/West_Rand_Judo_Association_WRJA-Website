import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_SCHOOL_IMAGE = "/uploads/public/default-school.jpeg";

export const schoolsStore = createRemoteCollection("/api/schools");
export const schoolsAdmin = adminCrud("/api/admin/schools", schoolsStore);
