import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { competitionsStore } from "../data/competitions";
import { eventsStore, getUpcomingCalendarEvents } from "../data/events";
import useCollection from "../hooks/useCollection";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateBadge(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return { day: date.getDate(), month: monthNames[date.getMonth()] };
}

export default function UpcomingEventsList() {
  const upcoming = getUpcomingCalendarEvents(useCollection(eventsStore), useCollection(competitionsStore)).slice(0, 5);

  return (
    <aside className="upcoming-events">
      <h3>Upcoming events</h3>

      {upcoming.length === 0 && <p className="upcoming-events-empty">No upcoming events right now.</p>}

      <div className="upcoming-events-list">
        {upcoming.map((event, index) => {
          const badge = formatDateBadge(event.date);
          return (
            <Reveal key={event.id} delay={index * 80}>
              <Link to={event.calendarPath} className="upcoming-event-card">
                <div className="upcoming-event-date-badge">
                  <span className="upcoming-event-day">{badge.day}</span>
                  <span className="upcoming-event-month">{badge.month}</span>
                </div>
                <div className="upcoming-event-info">
                  <p className="upcoming-event-type">{event.calendarLabel}</p>
                  <p className="upcoming-event-name">{event.name}</p>
                  <p className="upcoming-event-location">{event.location}</p>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </aside>
  );
}