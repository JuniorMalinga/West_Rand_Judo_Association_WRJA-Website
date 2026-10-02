import { adminCrud, createRemoteCollection } from "../lib/collections";

export const eventsStore = createRemoteCollection("/api/events");
export const eventsAdmin = adminCrud("/api/admin/events", eventsStore);

export const DEFAULT_EVENT_IMAGE = "/uploads/public/default-event.jpeg";
