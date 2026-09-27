import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { useAuth } from "../context/AuthContext";
import { getCompetitions } from "../data/competitions";

export default function CompetitionPaymentPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const competition = getCompetitions().find((item) => item.slug === slug);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  if (!competition) return <div className="simple-page"><h1>Payment page not found</h1><Link to="/events/competitions">Back to Events competitions</Link></div>;
  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) return setStatus("Please choose your EFT payment confirmation first.");
    localStorage.setItem("wrja.pop", JSON.stringify({
      name: file.name,
      size: file.size,
      competition: competition.slug,
      competitionName: competition.name,
      uploadedAt: new Date().toISOString(),
      status: "Submitted for review",
    }));
    setStatus(`Proof of Payment for ${competition.name} uploaded — WRJA will review it shortly.`);
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
              <input type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => { setFile(event.target.files?.[0] || null); setStatus(""); }} />
            </label>
            <button type="submit" className="btn btn-accent">Submit Proof of Payment</button>
            {status && <p className="pop-status" role="status">{status}</p>}
          </form>
        </Reveal>
      </section>
    </div>
  );
}
