import { useState } from "react";
import { defaultCompetitions, getCompetitions, getCompetitionStatus, saveCompetitions } from "../data/competitions";

const emptyCompetition = { ...defaultCompetitions[0], id: null, slug: "", name: "", description: "", date: "", location: "", registrationDeadline: "", registrationUrl: "", paymentInstructions: "", paymentUrl: "", image: defaultCompetitions[0].image, additionalInfo: "", displayOrder: 99, paymentRequired: false, registrationType: "external", registrationStatus: "Registration link pending" };

export default function AdminCompetitionsPanel() {
  const [competitions, setCompetitions] = useState(() => getCompetitions().sort((a, b) => a.displayOrder - b.displayOrder));
  const [formState, setFormState] = useState(null);
  const openAddForm = () => setFormState({ ...emptyCompetition, id: `competition-${Date.now()}`, slug: `new-event-${Date.now()}` });
  const openEditForm = (competition) => setFormState({ ...competition });
  const update = (field, value) => setFormState((current) => ({ ...current, [field]: value }));
  const handleSave = (event) => {
    event.preventDefault();
    const next = competitions.some((item) => item.id === formState.id) ? competitions.map((item) => item.id === formState.id ? formState : item) : [...competitions, formState];
    setCompetitions(next.sort((a, b) => a.displayOrder - b.displayOrder));
    saveCompetitions(next);
    setFormState(null);
  };
  const handleDelete = (id) => { if (window.confirm("Delete this competition?")) { const next = competitions.filter((item) => item.id !== id); setCompetitions(next); saveCompetitions(next); } };
  return <div className="admin-panel competition-admin-panel">
    <div className="admin-panel-header"><div><h2>Competitions &amp; registration links</h2><p className="admin-table-subtext">Update links and payment requirements without changing frontend code.</p></div><button className="btn btn-accent" onClick={openAddForm}>+ Add competition</button></div>
    {formState && <form className="admin-form" onSubmit={handleSave}>
      <div className="admin-form-row-2"><label>Competition name<input value={formState.name} onChange={(e) => update("name", e.target.value)} required /></label><label>Type<input value={formState.type} onChange={(e) => update("type", e.target.value)} required /></label></div>
      <div className="admin-form-row-2"><label>Date<input type="date" value={formState.date} onChange={(e) => update("date", e.target.value)} /></label><label>Location<input value={formState.location} onChange={(e) => update("location", e.target.value)} /></label></div>
      <div className="admin-form-row-2"><label>Registration deadline<input type="date" value={formState.registrationDeadline} onChange={(e) => update("registrationDeadline", e.target.value)} /></label><label>Display order<input type="number" value={formState.displayOrder} onChange={(e) => update("displayOrder", Number(e.target.value))} /></label></div>
      <label>Description<textarea rows="3" value={formState.description} onChange={(e) => update("description", e.target.value)} /></label>
      <div className="admin-form-row-2"><label>Registration type<select value={formState.registrationType} onChange={(e) => update("registrationType", e.target.value)}><option value="external">External registration</option><option value="internal">WRJA registration</option><option value="order">Order form</option></select></label><label>Competition status<select value={formState.registrationStatus} onChange={(e) => update("registrationStatus", e.target.value)}><option>Registration Open</option><option>Registration Not Yet Open</option><option>Registration Closing Soon</option><option>Registration Closed</option><option>Event Completed</option><option>Registration link pending</option></select></label></div>
      <label>Registration URL<input type="url" value={formState.registrationUrl} onChange={(e) => update("registrationUrl", e.target.value)} placeholder="https://..." /></label>
      <label className="admin-checkbox"><input type="checkbox" checked={formState.paymentRequired} onChange={(e) => update("paymentRequired", e.target.checked)} /> Payment required directly to WRJA</label>
      {formState.paymentRequired && <><label>Payment instructions<textarea rows="2" value={formState.paymentInstructions} onChange={(e) => update("paymentInstructions", e.target.value)} /></label><label>Payment URL<input type="url" value={formState.paymentUrl} onChange={(e) => update("paymentUrl", e.target.value)} placeholder="https://..." /></label></>}
      <label>Additional information<textarea rows="2" value={formState.additionalInfo} onChange={(e) => update("additionalInfo", e.target.value)} /></label>
      <div className="admin-form-actions"><button type="submit" className="btn btn-accent">Save competition</button><button type="button" className="btn btn-outline-dark" onClick={() => setFormState(null)}>Cancel</button></div>
    </form>}
    <table className="admin-table"><thead><tr><th>Competition</th><th>Status</th><th>Registration</th><th>Payment</th><th /></tr></thead><tbody>{competitions.map((competition) => <tr key={competition.id}><td><strong>{competition.name}</strong><div className="admin-table-subtext">{competition.type}</div></td><td><span className="competition-status competition-status-inline">{getCompetitionStatus(competition)}</span></td><td>{competition.registrationUrl ? <a href={competition.registrationUrl} target="_blank" rel="noreferrer">Open link</a> : "Not set"}</td><td>{competition.paymentRequired ? "Required" : "Not required"}</td><td className="admin-table-actions"><button onClick={() => openEditForm(competition)}>Edit</button><button onClick={() => handleDelete(competition.id)}>Delete</button></td></tr>)}</tbody></table>
  </div>;
}
