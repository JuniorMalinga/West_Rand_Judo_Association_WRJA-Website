import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { getCompetitionStatus, getCompetitions } from "../data/competitions";

function formatDate(date) {
  if (!date) return "Date to be announced";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function TracksuitOrderingPage({ competition }) {
  const hasOrderLink = Boolean(competition.registrationUrl);
  return (
    <div className="merch-product-page">
      <PageHeader title="Tracksuit Ordering" crumbs={[{ label: "Events", to: "/events" }, { label: "Store", to: "/events/store" }]} />
      <section className="merch-product-hero">
        <Reveal className="merch-product-stage">
          <div className="merch-product-image" style={{ backgroundImage: `url("${competition.image}")` }}>
            <span className="merch-product-badge">OFFICIAL WRJA KIT</span>
            <span className="merch-product-logo">WRJA<br /><small>&amp; JSA</small></span>
          </div>
          <div className="merch-product-thumbs"><span className="merch-thumb-active" style={{ backgroundImage: `url("${competition.image}")` }} /><span className="merch-thumb-logo">WRJA</span><span className="merch-thumb-label">KIT</span></div>
        </Reveal>
        <Reveal delay={100} className="merch-product-summary">
          <Link to="/events/store" className="merch-product-back">← Back to WRJA merch</Link>
          <p className="eyebrow">WRJA &amp; JSA / OFFICIAL COLLECTION</p>
          <h1>Tracksuit<br /><span>Ordering</span></h1>
          <p className="merch-product-intro">Represent the association with the official WRJA and JSA tracksuit. Built for athletes, coaches, families and supporters who carry the club with them beyond the dojo.</p>
          <div className="merch-product-tags"><span>Official kit</span><span>Made to order</span><span>WRJA collection</span></div>
          <div className="merch-order-panel">
            <div><p className="eyebrow">YOUR ORDER</p><h2>Reserve your tracksuit</h2><p>Complete the ordering details, then follow the WRJA payment instructions and submit your Proof of Payment.</p></div>
            <div className="merch-order-actions">
              {hasOrderLink ? <a href={competition.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">Start your order</a> : <Link to="/contact" className="btn btn-accent">Enquire to order</Link>}
              {competition.paymentRequired && <Link to={`/events/competitions/${competition.slug}/payment`} className="btn btn-outline-light">Payment &amp; POP upload</Link>}
            </div>
          </div>
        </Reveal>
      </section>
      <section className="merch-product-details">
        <div className="merch-detail-heading"><p className="eyebrow">WHY WRJA KIT</p><h2>More than a tracksuit.</h2><p>One official look for the athletes and supporters who represent the West Rand judo community.</p></div>
        <div className="merch-benefit-grid"><article><span>01</span><h3>Official identity</h3><p>Wear the WRJA and JSA colours at training, competitions and club events.</p></article><article><span>02</span><h3>Order with confidence</h3><p>Orders are confirmed through the WRJA team so sizing and collection details are clear.</p></article><article><span>03</span><h3>Simple payment flow</h3><p>Pay using the published WRJA details, then upload your Proof of Payment on the payment page.</p></article></div>
      </section>
    </div>
  );
}

export default function CompetitionDetailPage() {
  const { slug } = useParams();
  const [competition, setCompetition] = useState(() => getCompetitions().find((item) => item.slug === slug));
  useEffect(() => {
    const refresh = () => setCompetition(getCompetitions().find((item) => item.slug === slug));
    window.addEventListener("wrja:competitions-updated", refresh);
    return () => window.removeEventListener("wrja:competitions-updated", refresh);
  }, [slug]);

  if (!competition) return <div className="simple-page"><h1>Competition not found</h1><Link to="/events/competitions">Back to Events competitions</Link></div>;
  if (competition.slug === "tracksuit-ordering") return <TracksuitOrderingPage competition={competition} />;

  const status = getCompetitionStatus(competition);
  return <div className="competition-detail-page">
    <PageHeader title={competition.name} crumbs={[{ label: "Events", to: "/events" }, { label: "Competitions", to: "/events/competitions" }]} />
    <section className="competition-detail-layout">
      <Reveal className="competition-detail-image"><img src={competition.image} alt={competition.name} /></Reveal>
      <Reveal delay={120} className="competition-detail-content">
        <span className="competition-type">{competition.type}</span><span className="competition-status competition-status-inline">{status}</span>
        <h1>{competition.name}</h1><p className="competition-detail-description">{competition.description}</p>
        <div className="competition-detail-facts"><p>📅 <strong>Date</strong><br />{formatDate(competition.date)}</p><p>📍 <strong>Location</strong><br />{competition.location}</p>{competition.registrationDeadline && <p>⏳ <strong>Registration deadline</strong><br />{formatDate(competition.registrationDeadline)}</p>}</div>
        <div className="competition-detail-panel"><h3>Registration</h3><p>{competition.additionalInfo}</p>{competition.registrationUrl ? <a href={competition.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">{competition.registrationType === "internal" ? "Register now" : "Open external registration"}</a> : <p className="competition-pending">The registration link will be published by WRJA when entries open.</p>}</div>
        {competition.paymentRequired && <div className="competition-detail-panel competition-payment-panel"><h3>Payment to WRJA</h3><p>View the payment details and upload your Proof of Payment from one dedicated page.</p><Link to={`/events/competitions/${competition.slug}/payment`} className="btn btn-accent">View payment details &amp; upload POP</Link></div>}
        <Link to="/events/competitions" className="btn btn-outline-dark">← Back to Events competitions</Link>
      </Reveal>
    </section>
  </div>;
}
