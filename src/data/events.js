import { adminCrud, createRemoteCollection } from "../lib/collections";

export const eventsStore = createRemoteCollection("/api/events");
export const eventsAdmin = adminCrud("/api/admin/events", eventsStore);

export const DEFAULT_EVENT_IMAGE = "/uploads/public/default-event.jpeg";

export function getUpcomingEvents(events) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return events
		.filter((event) => new Date(`${event.date}T00:00:00`) >= today)
		.sort((a, b) => a.date.localeCompare(b.date));
}

export function getUpcomingCalendarEvents(events, competitions) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const calendarEvents = [
		...events.map((event) => ({
			...event,
			calendarType: "event",
			calendarLabel: event.type,
			calendarPath: `/events/${event.id}`,
		})),
		...competitions.map((competition) => ({
			...competition,
			calendarType: "competition",
			calendarLabel: "Competition",
			calendarPath: `/events/competitions/${competition.slug}`,
		})),
	];

	return calendarEvents
		.filter((event) => {
			const eventDate = new Date(`${event.date}T00:00:00`);
			return !Number.isNaN(eventDate.getTime()) && eventDate >= today;
		})
		.sort((a, b) => a.date.localeCompare(b.date));
}
