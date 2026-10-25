import { adminCrud, createRemoteCollection } from "../lib/collections";

export const users = [
  { id: 1, firstName: "Admin", lastName: "User", email: "admin@wrja.co.za", role: "admin", phone: "" },
  { id: 2, firstName: "Demo", lastName: "Member", email: "member@wrja.co.za", role: "member", phone: "" },
];

export const usersStore = createRemoteCollection("/api/admin/users");
usersStore.setItems(users);
export const usersAdmin = adminCrud("/api/admin/users", usersStore);

export default users;
