import { Link } from "react-router-dom";
import { getCompetitionStatus } from "../data/competitions";

function formatDate(date) {
  if (!date) return "Date to be announced";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export default function CompetitionCard({ competition }) {
  const status = getCompetitionStatus(competition);
  const hasRegistration = Boolean(competition.registrationUrl);
  return (
    <article className="competition-card">
      <div className="competition-card-image" style={{ backgroundImage: `url("${competition.image}")` }}>
        <span className={`competition-status competition-status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>
      </div>
      <div className="competition-card-body">
        <p className="competition-type">{competition.type}</p>
        <h2>{competition.name}</h2>
        <p className="competition-description">{competition.description}</p>
        <div className="competition-meta"><span>📅 {formatDate(competition.date)}</span><span>📍 {competition.location}</span></div>
        <div className="competition-card-actions">
          <Link to={`/events/competitions/${competition.slug}`} className="btn btn-outline-dark">View details</Link>
          {hasRegistration ? <a href={competition.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">{competition.registrationType === "internal" ? "Register now" : "Open registration"}</a> : <span className="competition-pending">Link pending</span>}
        </div>
        {competition.paymentRequired && <Link to={`/events/competitions/${competition.slug}/payment`} className="competition-payment-note">Payment details &amp; POP upload →</Link>}
      </div>
    </article>
  );
}
