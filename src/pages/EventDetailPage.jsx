import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { getPublishedEventById } from "../services/eventsService";
import placeholder from "../assets/images/team/image 79.jpg";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      try {
        setLoading(true);
        setError("");
        const data = await getPublishedEventById(id);
        if (isMounted) setEvent(data);
      } catch (err) {
        console.error("Error loading event details:", err);
        if (isMounted) setError("Could not load event details right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="event-detail-page">
        <PageHeader title="Event Details" crumbs={[{ label: "Events", to: "/events" }]} />
        <p className="simple-page">Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-detail-page">
        <PageHeader title="Event Details" crumbs={[{ label: "Events", to: "/events" }]} />
        <div className="simple-page">
          <p>{error}</p>
          <Link to="/events" className="btn btn-outline-dark">&larr; Back to all events</Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-page">
        <PageHeader title="Event Not Found" crumbs={[{ label: "Events", to: "/events" }]} />
        <div className="simple-page">
          <h1>Event not found</h1>
          <p>This event may not exist or is no longer published.</p>
          <Link to="/events" className="btn btn-outline-dark">&larr; Back to all events</Link>
        </div>
      </div>
    );
  }

  const formattedDate = event.date
    ? new Date(`${event.date}T00:00:00`).toLocaleDateString("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date to be announced";

  return (
    <div className="event-detail-page">
      <PageHeader title={event.name} crumbs={[{ label: "Events", to: "/events" }]} />

      <section className="event-detail">
        <Reveal className="event-detail-image-wrap">
          <img src={event.image || placeholder} alt={event.name} />
        </Reveal>

        <Reveal delay={150} className="event-detail-content">
          <span className="event-detail-type">{event.type}</span>
          <p className="event-detail-meta">
            &#128197; {formattedDate}
            {event.startTime ? ` (${event.startTime.slice(0, 5)}${event.endTime ? ` - ${event.endTime.slice(0, 5)}` : ""})` : ""}
            {event.location ? <> &nbsp;&middot;&nbsp; &#128205; {event.location}</> : null}
          </p>
          {event.registrationDeadline && (
            <p className="event-detail-meta" style={{ marginTop: "-8px" }}>
              Registration deadline: {new Date(`${event.registrationDeadline}T00:00:00`).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
          <p>{event.description}</p>
          <Link to="/events" className="btn btn-outline-dark">&larr; Back to all events</Link>
        </Reveal>
      </section>

      <Reveal className="event-application-section">
        <h2>Apply for this event</h2>

        {event.entryFormUrl ? (
          <div className="event-application-options">
            <div className="event-application-option">
              <p>Download or view the official event entry form.</p>
              <a
                href={event.entryFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-accent"
              >
                Open entry form
              </a>
            </div>
          </div>
        ) : (
          <p className="event-application-none">
            Applications for this event aren't open yet — use the enquiry form below and we'll let you know as soon as they are.
          </p>
        )}
      </Reveal>

      <Reveal delay={100} className="event-enquiry-section">
        <h2>Enquire about this event</h2>
        <p>Have a question about this event? Send us a message and we'll get back to you.</p>

        {/* Non-functional for now — no submit handling wired up yet. */}
        <form className="event-enquiry-form" onSubmit={(event) => event.preventDefault()}>
          <div className="event-enquiry-row">
            <input type="text" placeholder="Your name" required />
            <input type="email" placeholder="Your email" required />
          </div>
          <textarea rows="4" placeholder="Your question" required />
          <button type="submit" className="btn btn-accent">Send enquiry</button>
        </form>
      </Reveal>
    </div>
  );
}