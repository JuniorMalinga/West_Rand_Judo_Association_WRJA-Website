import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import FormStatus from "../components/FormStatus";
import HoneypotField from "../components/HoneypotField";
import { useCollectionState } from "../hooks/useCollection";
import useEnquiryForm from "../hooks/useEnquiryForm";
import { eventsStore } from "../data/events";

export default function EventDetailPage() {
  const { id } = useParams();
  const { items: events, loaded } = useCollectionState(eventsStore);
  const event = events.find((item) => String(item.id) === id);
  const enquiry = useEnquiryForm({ source: `Event enquiry: ${event?.name || id}` });

  if (!event && !loaded) return <div className="simple-page"><p>Loading event…</p></div>;

  if (!event) {
    return (
      <div className="simple-page">
        <h1>Event not found</h1>
        <Link to="/events">Back to events</Link>
      </div>
    );
  }

  const formattedDate = new Date(`${event.date}T12:00:00`).toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="event-detail-page">
      <PageHeader title={event.name} crumbs={[{ label: "Events", to: "/events" }]} />

      <section className="event-detail">
        <Reveal className="event-detail-image-wrap">
          <img src={event.image} alt={event.name} />
        </Reveal>

        <Reveal delay={150} className="event-detail-content">
          <span className="event-detail-type">{event.type}</span>
          <p className="event-detail-meta">
            &#128197; {formattedDate} &nbsp;&middot;&nbsp; &#128205; {event.location}
          </p>
          <p>{event.description}</p>
          <Link to="/events" className="btn btn-outline-dark">&larr; Back to all events</Link>
        </Reveal>
      </section>

      <Reveal className="event-application-section">
        <h2>Apply for this event</h2>

        {event.applicationSheetUrl || event.qrCodeImage ? (
          <div className="event-application-options">
            {event.applicationSheetUrl && (
              <div className="event-application-option">
                <p>Apply online through our entry form.</p>
                <a
                  href={event.applicationSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent"
                >
                  Open application form
                </a>
              </div>
            )}

            {event.qrCodeImage && (
              <div className="event-application-option">
                <p>Or scan this code with your phone to apply.</p>
                <img src={event.qrCodeImage} alt="Scan to apply" className="event-qr-code" />
              </div>
            )}
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

        <form className="event-enquiry-form" onSubmit={enquiry.submit}>
          <HoneypotField value={enquiry.values.website} onChange={enquiry.setField("website")} />
          <div className="event-enquiry-row">
            <input type="text" placeholder="Your name" value={enquiry.values.name} onChange={enquiry.setField("name")} required />
            <input type="email" placeholder="Your email" value={enquiry.values.email} onChange={enquiry.setField("email")} required />
          </div>
          <textarea rows="4" placeholder="Your question" value={enquiry.values.message} onChange={enquiry.setField("message")} required />
          <button type="submit" className="btn btn-accent" disabled={enquiry.sending}>{enquiry.sending ? "Sending…" : "Send enquiry"}</button>
          <FormStatus status={enquiry.status} />
        </form>
      </Reveal>
    </div>
  );
}