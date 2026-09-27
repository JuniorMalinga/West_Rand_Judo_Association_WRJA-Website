import { useState } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { useAuth } from "../context/AuthContext";

export default function ProofOfPaymentPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  if (!user) return <Navigate to="/login" replace />;
  const handleSubmit = (event) => { event.preventDefault(); if (!file) return setStatus("Please choose your EFT payment confirmation first."); localStorage.setItem("wrja.pop", JSON.stringify({ name: file.name, size: file.size, uploadedAt: new Date().toISOString(), status: "Submitted for review" })); setStatus("Proof of Payment uploaded — WRJA will review it shortly."); };
  return <div className="pop-page"><PageHeader title="Proof of Payment" /><section className="pop-section"><Reveal className="pop-card"><p className="eyebrow">WRJA PAYMENTS</p><h2>Upload your Proof of Payment</h2><p>Use this area to upload your EFT payment confirmation for an event or order. This is not a registration form.</p><form onSubmit={handleSubmit} className="pop-form"><label className="pop-dropzone"><span className="pop-upload-icon">↑</span><strong>{file ? file.name : "Choose your EFT payment confirmation"}</strong><span>{file ? `${Math.ceil(file.size / 1024)} KB selected` : "PDF, JPG or PNG"}</span><input type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => { setFile(event.target.files?.[0] || null); setStatus(""); }} /></label><button type="submit" className="btn btn-accent">Upload POP</button>{status && <p className="pop-status" role="status">{status}</p>}</form></Reveal></section></div>;
}
