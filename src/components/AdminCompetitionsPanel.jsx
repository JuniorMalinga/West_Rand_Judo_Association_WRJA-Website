import { useMemo, useState } from "react";
import ImageUploadField from "./ImageUploadField";
import { useCollectionState } from "../hooks/useCollection";
import useNotice from "../hooks/useNotice";
import { competitionsAdmin, competitionsStore, DEFAULT_COMPETITION_IMAGE, getCompetitionStatus } from "../data/competitions";
import { formatDate, isHttpUrl } from "../lib/format";

const REGISTRATION_STATUSES = [
  "Registration Open",
  "Registration Not Yet Open",
  "Registration Closing Soon",
  "Registration Closed",
  "Event Completed",
  "Registration link pending",
];

const emptyCompetition = {
  name: "",
  type: "Competition",
  description: "",
  date: "",
  location: "",
  registrationDeadline: "",
  registrationStatus: "Registration link pending",
  registrationType: "external",
  registrationUrl: "",
  paymentRequired: false,
  paymentInstructions: "",
  paymentUrl: "",
  image: DEFAULT_COMPETITION_IMAGE,
  additionalInfo: "",
  displayOrder: 99,
};

export default function AdminCompetitionsPanel() {
  const { items: stored, loaded, error: loadError } = useCollectionState(competitionsStore);
  const [saving, setSaving] = useState(false);
  const competitions = useMemo(() => [...stored].sort((a, b) => a.displayOrder - b.displayOrder), [stored]);
  const [formState, setFormState] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");
  const { notice, show, clear } = useNotice();

  const types = [...new Set(competitions.map((item) => item.type))];
  const visible = competitions.filter((item) =>
    `${item.name} ${item.type} ${item.location}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  const update = (field, value) => setFormState((current) => ({ ...current, [field]: value }));

  const openAdd = () => {
    clear();
    setIsNew(true);
    setFormState({ ...emptyCompetition, displayOrder: competitions.length + 1 });
  };
  const openEdit = (competition) => {
    clear();
    setIsNew(false);
    setFormState({ ...competition });
  };
  const closeForm = () => setFormState(null);

  const handleSave = async (event) => {
    event.preventDefault();
    if (formState.registrationUrl && !isHttpUrl(formState.registrationUrl)) return show("error", "Registration URL must start with http:// or https://");
    if (formState.paymentUrl && !isHttpUrl(formState.paymentUrl)) return show("error", "Payment URL must start with http:// or https://");

    setSaving(true);
    try {
      if (isNew) await competitionsAdmin.create(formState);
      else await competitionsAdmin.update(formState.id, formState);
      closeForm();
      show("success", isNew ? "Competition added. It is now live on the site." : "Competition updated.");
    } catch (error) {
      show("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (competition) => {
    const extra = competition.slug === "tracksuit-ordering" ? "\n\nNote: the Store page uses this entry for tracksuit ordering." : "";
    if (!window.confirm(`Delete "${competition.name}"?${extra}`)) return;
    try {
      await competitionsAdmin.remove(competition.id);
      show("success", "Competition deleted.");
    } catch (error) {
      show("error", error.message);
    }
  };

  return (
    <div className="admin-panel competition-admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Competitions &amp; registration links</h2>
          <p className="admin-table-subtext">Everything here appears on the Home, Events and Competition pages as soon as you save.</p>
        </div>
        <button className="btn btn-accent" onClick={openAdd}>+ Add competition</button>
      </div>

      {loadError && <p className="admin-notice admin-notice-error">{loadError}</p>}
      {notice && <p className={`admin-notice admin-notice-${notice.type}`} role="status">{notice.text}</p>}

      {formState && (
        <form className="admin-form" onSubmit={handleSave}>
          <h3 className="admin-form-title">{isNew ? "New competition" : `Editing ${formState.name}`}</h3>
          <div className="admin-form-row-2">
            <label>Competition name<input value={formState.name} onChange={(e) => update("name", e.target.value)} required /></label>
            <label>Type
              <input list="competition-types" value={formState.type} onChange={(e) => update("type", e.target.value)} required />
              <datalist id="competition-types">{types.map((type) => <option key={type} value={type} />)}</datalist>
            </label>
          </div>
          <div className="admin-form-row-2">
            <label>Date<input type="date" value={formState.date} onChange={(e) => update("date", e.target.value)} /></label>
            <label>Location<input value={formState.location} onChange={(e) => update("location", e.target.value)} /></label>
          </div>
          <div className="admin-form-row-2">
            <label>Registration deadline<input type="date" value={formState.registrationDeadline} onChange={(e) => update("registrationDeadline", e.target.value)} /></label>
            <label>Display order<input type="number" min="1" value={formState.displayOrder} onChange={(e) => update("displayOrder", Number(e.target.value))} /></label>
          </div>
          <label>Description<textarea rows="3" value={formState.description} onChange={(e) => update("description", e.target.value)} /></label>

          <ImageUploadField
            label="Card image"
            value={formState.image}
            onChange={(value) => update("image", value || DEFAULT_COMPETITION_IMAGE)}
            removeLabel="Use default image"
            onError={(text) => show("error", text)}
          />

          <div className="admin-form-row-2">
            <label>Registration type
              <select value={formState.registrationType} onChange={(e) => update("registrationType", e.target.value)}>
                <option value="external">External registration</option>
                <option value="internal">WRJA registration</option>
                <option value="order">Order form</option>
              </select>
            </label>
            <label>Status shown to members
              <select value={formState.registrationStatus} onChange={(e) => update("registrationStatus", e.target.value)}>
                {REGISTRATION_STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>
          <label>Registration URL<input type="url" value={formState.registrationUrl} onChange={(e) => update("registrationUrl", e.target.value)} placeholder="https://..." /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={formState.paymentRequired} onChange={(e) => update("paymentRequired", e.target.checked)} /> Payment required directly to WRJA</label>
          {formState.paymentRequired && (
            <>
              <label>Payment instructions<textarea rows="3" value={formState.paymentInstructions} onChange={(e) => update("paymentInstructions", e.target.value)} placeholder="Bank, account number, branch code and payment reference" /></label>
              <label>Payment URL (optional)<input type="url" value={formState.paymentUrl} onChange={(e) => update("paymentUrl", e.target.value)} placeholder="https://..." /></label>
            </>
          )}
          <label>Additional information<textarea rows="2" value={formState.additionalInfo} onChange={(e) => update("additionalInfo", e.target.value)} /></label>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving…" : isNew ? "Add competition" : "Save changes"}</button>
            <button type="button" className="btn btn-outline-dark" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-toolbar">
        <input type="search" className="admin-search" placeholder="Search competitions…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="admin-count">{visible.length} of {competitions.length}</span>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Competition</th><th>Date</th><th>Status</th><th>Registration</th><th>Payment</th><th /></tr></thead>
          <tbody>
            {visible.map((competition) => (
              <tr key={competition.id}>
                <td><img className="admin-thumb" src={competition.image} alt="" /></td>
                <td><strong>{competition.name}</strong><div className="admin-table-subtext">{competition.type}</div></td>
                <td>{formatDate(competition.date)}</td>
                <td><span className="admin-badge">{getCompetitionStatus(competition)}</span></td>
                <td>{competition.registrationUrl ? <a href={competition.registrationUrl} target="_blank" rel="noreferrer">Open link</a> : <span className="admin-muted">Not set</span>}</td>
                <td>{competition.paymentRequired ? "Required" : <span className="admin-muted">Not required</span>}</td>
                <td className="admin-table-actions"><button onClick={() => openEdit(competition)}>Edit</button><button className="danger" onClick={() => handleDelete(competition)}>Delete</button></td>
              </tr>
            ))}
            {!loaded && <tr><td colSpan="7" className="admin-empty-cell">Loading…</td></tr>}
            {loaded && visible.length === 0 && <tr><td colSpan="7" className="admin-empty-cell">No competitions match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
