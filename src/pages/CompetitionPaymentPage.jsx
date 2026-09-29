import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { useAuth } from "../context/AuthContext";
import useCollection, { useCollectionState } from "../hooks/useCollection";
import { competitionsStore } from "../data/competitions";
import { myPaymentsStore, paymentFileUrl, submitPayment } from "../data/payments";
import { formatDateTime } from "../lib/format";

export default function CompetitionPaymentPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { items: competitions, loaded } = useCollectionState(competitionsStore);
  const competition = competitions.find((item) => item.slug === slug);
  const payments = useCollection(myPaymentsStore);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!competition && !loaded) return <div className="simple-page"><p>Loading…</p></div>;
  if (!competition) return <div className="simple-page"><h1>Payment page not found</h1><Link to="/events/competitions">Back to Events competitions</Link></div>;
  if (!user) return <Navigate to="/login" replace />;

  const mine = payments.filter((item) => item.competitionSlug === competition.slug);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await submitPayment({ file, competition });
      setFile(null);
      event.target.reset();
      setStatus({ type: "success", text: `Proof of Payment for ${competition.name} uploaded — WRJA will review it shortly.` });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="competition-payment-page">
      <PageHeader title="Payment details" crumbs={[{ label: "Events", to: "/events" }, { label: "Competitions", to: "/events/competitions" }, { label: competition.name, to: `/events/competitions/${competition.slug}` }]} />
      <section className="competition-payment-layout">
        <Reveal className="competition-payment-info">
          <p className="eyebrow">WRJA PAYMENT</p>
          <h1>{competition.name}</h1>
          <p className="competition-payment-lede">Complete your payment using the details below, then upload your Proof of Payment on this page so the WRJA team can match it to your entry.</p>
          <div className="competition-payment-details">
            <h2>Payment details</h2>
            <p>{competition.paymentInstructions || "Payment details will be published by the WRJA admin team before registration closes. Please contact WRJA if you need the banking details confirmed."}</p>
            {competition.paymentUrl && <a href={competition.paymentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent">Open payment link</a>}
            {!competition.paymentInstructions && <Link to={`/contact?topic=${encodeURIComponent(`Banking details for ${competition.name}`)}`} className="btn btn-outline-dark">Ask WRJA for banking details</Link>}
          </div>
          <Link to={`/events/competitions/${competition.slug}`} className="btn btn-outline-dark">← Back to competition</Link>
        </Reveal>
        <Reveal delay={100} className="competition-pop-card">
          <p className="eyebrow">STEP 2</p>
          <h2>Upload Proof of Payment</h2>
          <p>Upload the EFT confirmation for <strong>{competition.name}</strong>. Accepted formats: PDF, JPG or PNG.</p>
          <form onSubmit={handleSubmit} className="pop-form">
            <label className="pop-dropzone">
              <span className="pop-upload-icon">↑</span>
              <strong>{file ? file.name : "Choose your payment confirmation"}</strong>
              <span>{file ? `${Math.ceil(file.size / 1024)} KB selected` : "Click to browse your files"}</span>
              <input type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => { setFile(event.target.files?.[0] || null); setStatus(null); }} />
            </label>
            <button type="submit" className="btn btn-accent" disabled={busy}>{busy ? "Uploading…" : "Submit Proof of Payment"}</button>
            {status && <p className={`pop-status pop-status-${status.type}`} role="status">{status.text}</p>}
          </form>
          {mine.length > 0 && (
            <div className="pop-history">
              <h3>Your submissions</h3>
              <ul>{mine.map((item) => <li key={item.id}><span><a href={paymentFileUrl(item.id)} target="_blank" rel="noopener noreferrer">{item.fileName}</a><small>{formatDateTime(item.uploadedAt)}</small></span><b className={`pop-chip pop-chip-${item.status === "Approved" ? "ok" : item.status === "Rejected" ? "bad" : "warn"}`}>{item.status}</b></li>)}</ul>
            </div>
          )}
        </Reveal>
      </section>
    </div>
  );
}
