import { useState } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { useAuth } from "../context/AuthContext";
import { competitionsStore } from "../data/competitions";
import useCollection from "../hooks/useCollection";
import { submitPayment } from "../data/payments";

export default function ProofOfPaymentPage() {
  const { user } = useAuth();
  const competitions = useCollection(competitionsStore);
  const [file, setFile] = useState(null);
  const [competitionSlug, setCompetitionSlug] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!user) return <Navigate to="/login" replace />;

  const payable = competitions.filter((item) => item.paymentRequired);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const competition = payable.find((item) => item.slug === competitionSlug) || null;
      await submitPayment({ file, competition });
      setFile(null);
      event.target.reset();
      setStatus({ type: "success", text: "Proof of Payment uploaded — WRJA will review it shortly." });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pop-page">
      <PageHeader title="Proof of Payment" />
      <section className="pop-section">
        <Reveal className="pop-card">
          <p className="eyebrow">WRJA PAYMENTS</p>
          <h2>Upload your Proof of Payment</h2>
          <p>Use this area to upload your EFT payment confirmation for an event or order. This is not a registration form.</p>
          <form onSubmit={handleSubmit} className="pop-form">
            <label className="pop-select">What is this payment for?
              <select value={competitionSlug} onChange={(event) => setCompetitionSlug(event.target.value)}>
                <option value="">Other / not listed</option>
                {payable.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
              </select>
            </label>
            <label className="pop-dropzone">
              <span className="pop-upload-icon">↑</span>
              <strong>{file ? file.name : "Choose your EFT payment confirmation"}</strong>
              <span>{file ? `${Math.ceil(file.size / 1024)} KB selected` : "PDF, JPG or PNG"}</span>
              <input type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => { setFile(event.target.files?.[0] || null); setStatus(null); }} />
            </label>
            <button type="submit" className="btn btn-accent" disabled={busy}>{busy ? "Uploading…" : "Upload POP"}</button>
            {status && <p className={`pop-status pop-status-${status.type}`} role="status">{status.text}</p>}
          </form>
        </Reveal>
      </section>
    </div>
  );
}
