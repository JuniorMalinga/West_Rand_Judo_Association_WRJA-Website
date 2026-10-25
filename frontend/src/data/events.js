import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_EVENT_IMAGE = "/src/assets/images/Logo/wrja-logo.png";

export const events = [
  {
    id: "event-1",
    slug: "club-training-night",
    name: "Club training night",
    type: "Training",
    description: "A normal club training night with technical coaching and guided drills.",
    date: "2026-10-25",
    time: "18:00",
    location: "West Rand dojo",
    image: DEFAULT_EVENT_IMAGE,
    displayOrder: 1,
  },
  {
    id: "event-2",
    slug: "fundamental-skills-day",
    name: "Fundamental skills day",
    type: "Workshop",
    description: "A skills-focused session for Juniors and beginners on movement, balance and safely building confidence.",
    date: "2026-11-08",
    time: "10:00",
    location: "Club hall",
    image: DEFAULT_EVENT_IMAGE,
    displayOrder: 2,
  },
];

export const eventsStore = createRemoteCollection("/api/events");
eventsStore.setItems(events);
export const eventsAdmin = adminCrud("/api/admin/events", eventsStore);

export function getUpcomingEvents(items = []) {
  return [...items].filter((event) => event.date).sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getUpcomingCalendarEvents(items = []) {
  return getUpcomingEvents(items);
}

export default events;
