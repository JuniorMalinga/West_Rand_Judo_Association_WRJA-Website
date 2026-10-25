import { Link } from "react-router-dom";

function formatDate(date) {
  if (!date) return "Date to be announced";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EventCard({ event }) {
  return (
    <article className="competition-card event-preview-card">
      <div className="competition-card-image">
        <img className="competition-card-image-media" src={event.image} alt="" loading="lazy" decoding="async" />
        <span className="competition-status">Upcoming event</span>
      </div>
      <div className="competition-card-body">
        <p className="competition-type">{event.type}</p>
        <h2>{event.name}</h2>
        <p className="competition-description">{event.description || "Event details will be announced by WRJA."}</p>
        <div className="competition-meta">
          <span>📅 {formatDate(event.date)}</span>
          <span>📍 {event.location || "Location to be announced"}</span>
        </div>
        <div className="competition-card-actions">
          <Link to={`/events/${event.id}`} className="btn btn-accent">View event details</Link>
        </div>
      </div>
    </article>
  );
}
