// Every "contact the club" form sends its message here; the admin reads them
// in the Messages tab.

import { api, notifyAdminChanged } from "../lib/api";
import { createRemoteCollection } from "../lib/collections";

export const messagesStore = createRemoteCollection("/api/admin/messages");

export const isUnread = (message) => message.status === "new";

export async function submitMessage({ name, email, phone = "", message, source = "Contact page", website = "" }) {
  await api("/api/messages", { method: "POST", body: { name, email, phone, message, source, website } });
}

const changed = async (result) => {
  await messagesStore.refresh();
  notifyAdminChanged();
  return result;
};

export const setMessageStatus = (id, status) => api(`/api/admin/messages/${id}`, { method: "PATCH", body: { status } }).then(changed);
export const markAllMessagesRead = () => api("/api/admin/messages/read-all", { method: "POST", body: {} }).then(changed);
export const deleteMessage = (id) => api(`/api/admin/messages/${id}`, { method: "DELETE" }).then(changed);
