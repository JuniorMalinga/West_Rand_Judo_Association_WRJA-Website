import { createRemoteCollection } from "../lib/collections";

export const messages = [
  {
    id: 1,
    name: "Sample member",
    email: "member@example.com",
    phone: "",
    message: "Hello, I would like to learn more about junior classes.",
    source: "Contact form",
    status: "new",
    createdAt: new Date().toISOString(),
  },
];

export const messagesStore = createRemoteCollection("/api/messages");
messagesStore.setItems(messages);

export function isUnread(message) {
  return !message || message.status === "new" || message.status === "unread";
}

export function deleteMessage(messageId) {
  const next = messagesStore.getSnapshot().items.filter((item) => item.id !== messageId);
  messagesStore.setItems(next);
  return Promise.resolve({ ok: true });
}

export function markAllMessagesRead() {
  const next = messagesStore.getSnapshot().items.map((item) => ({ ...item, status: "read" }));
  messagesStore.setItems(next);
  return Promise.resolve(next);
}

export function setMessageStatus(messageId, status) {
  const next = messagesStore.getSnapshot().items.map((item) => (item.id === messageId ? { ...item, status } : item));
  messagesStore.setItems(next);
  return Promise.resolve(next.find((item) => item.id === messageId));
}

export async function submitMessage(data) {
  const next = [...messagesStore.getSnapshot().items, {
    id: Date.now(),
    ...data,
    status: "new",
    createdAt: new Date().toISOString(),
  }];
  messagesStore.setItems(next);
  return { ok: true, item: next[next.length - 1] };
}

export default messages;
