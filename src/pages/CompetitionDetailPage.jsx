import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { getCompetitionStatus, getCompetitions } from "../data/competitions";

function formatDate(date) {
  if (!date) return "Date to be announced";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function CompetitionDetailPage() {
  const { slug } = useParams();
  const [competition, setCompetition] = useState(() => getCompetitions().find((item) => item.slug === slug));
  useEffect(() => {
    const refresh = () => setCompetition(getCompetitions().find((item) => item.slug === slug));
    window.addEventListener("wrja:competitions-updated", refresh);
    return () => window.removeEventListener("wrja:competitions-updated", refresh);
  }, [slug]);
  if (!competition) return <div className="simple-page"><h1>Competition not found</h1><Link to="/competitions">Back to competitions</Link></div>;
  const status = getCompetitionStatus(competition);
  return <div className="competition-detail-page">
    <PageHeader title={competition.name} crumbs={[{ label: "Competitions", to: "/competitions" }]} />
    <section className="competition-detail-layout">
      <Reveal className="competition-detail-image"><img src={competition.image} alt={competition.name} /></Reveal>
      <Reveal delay={120} className="competition-detail-content">
        <span className="competition-type">{competition.type}</span><span className="competition-status competition-status-inline">{status}</span>
        <h1>{competition.name}</h1><p className="competition-detail-description">{competition.description}</p>
        <div className="competition-detail-facts"><p>📅 <strong>Date</strong><br />{formatDate(competition.date)}</p><p>📍 <strong>Location</strong><br />{competition.location}</p>{competition.registrationDeadline && <p>⏳ <strong>Registration deadline</strong><br />{formatDate(competition.registrationDeadline)}</p>}</div>
        <div className="competition-detail-panel"><h3>Registration</h3><p>{competition.additionalInfo}</p>{competition.registrationUrl ? <a href={competition.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">{competition.registrationType === "internal" ? "Register now" : "Open external registration"}</a> : <p className="competition-pending">The registration link will be published by WRJA when entries open.</p>}</div>
        {competition.paymentRequired && <div className="competition-detail-panel competition-payment-panel"><h3>Payment to WRJA</h3><p>{competition.paymentInstructions}</p>{competition.paymentUrl && <a href={competition.paymentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">Pay WRJA</a>}<Link to="/proof-of-payment" className="btn btn-outline-dark">Upload proof of payment</Link></div>}
        <Link to="/competitions" className="btn btn-outline-dark">← Back to all competitions</Link>
      </Reveal>
    </section>
  </div>;
}
