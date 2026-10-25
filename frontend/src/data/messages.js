import { createRemoteCollection } from "../lib/collections";
import { api, notifyAdminChanged } from "../lib/api";

const ADMIN_MESSAGES_PATH = "/api/admin/messages";

export const messagesStore = createRemoteCollection(ADMIN_MESSAGES_PATH);

export function isUnread(message) {
  return message?.status === "new" || message?.status === "unread";
}

async function finishMessageChange(request) {
  const result = await request;
  await messagesStore.refresh();
  notifyAdminChanged(messagesStore.path);
  return result;
}

export function deleteMessage(messageId) {
  return finishMessageChange(api(`${ADMIN_MESSAGES_PATH}/${encodeURIComponent(messageId)}`, { method: "DELETE" }));
}

export function markAllMessagesRead() {
  return finishMessageChange(api(`${ADMIN_MESSAGES_PATH}/read-all`, { method: "POST", body: {} }));
}

export async function setMessageStatus(messageId, status) {
  const { item } = await finishMessageChange(api(`${ADMIN_MESSAGES_PATH}/${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    body: { status },
  }));
  return item;
}

export async function submitMessage(data) {
  const result = await api("/api/messages", { method: "POST", body: data });
  notifyAdminChanged(messagesStore.path);
  return result;
}
