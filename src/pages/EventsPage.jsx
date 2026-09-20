import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import UpcomingEventsList from "../components/UpcomingEventsList";
import EventsCalendar from "../components/EventsCalendar";
import { getPublishedEvents } from "../services/eventsService";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const result = await getPublishedEvents();

        if (!cancelled) {
          setEvents(result);
        }
      } catch (loadError) {
        console.error(
          "Could not load WRJA events:",
          loadError
        );

        if (!cancelled) {
          setError(
            "Events could not be loaded right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="events-page">
      <PageHeader title="Events" />

      {loading && (
        <p className="simple-page">
          Loading events...
        </p>
      )}

      {error && (
        <p className="simple-page">{error}</p>
      )}

      {!loading && !error && (
        <section className="events-page-layout">
          <UpcomingEventsList events={events} />
          <EventsCalendar events={events} />
        </section>
      )}
    </div>
  );
}