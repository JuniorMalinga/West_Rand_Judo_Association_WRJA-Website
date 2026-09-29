import { adminCrud, createRemoteCollection } from "../lib/collections";

export const usersStore = createRemoteCollection("/api/admin/users");
export const usersAdmin = adminCrud("/api/admin/users", usersStore);
