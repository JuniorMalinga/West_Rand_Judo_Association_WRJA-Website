import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_EVENT_IMAGE = "/src/assets/images/Logo/wrja-logo.png";

export const eventsStore = createRemoteCollection("/api/events");
export const eventsAdmin = adminCrud("/api/admin/events", eventsStore);

export function getUpcomingEvents(items = []) {
  return [...items].filter((event) => event.date).sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getUpcomingCalendarEvents(items = []) {
  return getUpcomingEvents(items);
}
