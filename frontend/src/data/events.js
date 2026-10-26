import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_EVENT_IMAGE = "/uploads/public/default-event.jpeg";

export const eventsStore = createRemoteCollection("/api/events");
export const eventsAdmin = adminCrud("/api/admin/events", eventsStore);

export function getUpcomingEvents(items = []) {
  return [...items]
    .filter((event) => event.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function isValidCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

export function getCalendarEvents(events = [], competitions = [], schools = []) {
  const standardEvents = events.map((event) => ({
    ...event,
    calendarType: "event",
    calendarLabel: "WRJA event",
    calendarPath: `/events/${event.id}`,
  }));

  const competitionEvents = competitions
    .filter((competition) => (
      !competition.slug?.startsWith("sa-schools-") &&
      competition.type !== "Club ordering"
    ))
    .map((competition) => ({
      ...competition,
      calendarType: "competition",
      calendarLabel: "Competition",
      calendarPath: `/events/competitions/${competition.slug}`,
    }));

  const schoolEvents = schools.map((school) => ({
    ...school,
    calendarType: "school",
    calendarLabel: "School event",
    calendarPath: `/events/competitions/${school.slug}`,
  }));

  return [...standardEvents, ...competitionEvents, ...schoolEvents]
    .filter((event) => isValidCalendarDate(event.date))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getUpcomingCalendarEvents(events = [], competitions = [], schools = []) {
  const today = new Date();
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return getCalendarEvents(events, competitions, schools)
    .filter((event) => event.date >= todayDate);
}
