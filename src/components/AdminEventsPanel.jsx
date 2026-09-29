import { useMemo, useState } from "react";
import ImageUploadField from "./ImageUploadField";
import { useCollectionState } from "../hooks/useCollection";
import useNotice from "../hooks/useNotice";
import { DEFAULT_EVENT_IMAGE, eventsAdmin, eventsStore } from "../data/events";
import { formatDate, isHttpUrl } from "../lib/format";

const emptyEvent = {
  name: "",
  type: "",
  date: "",
  location: "",
  description: "",
  image: DEFAULT_EVENT_IMAGE,
  applicationSheetUrl: "",
  qrCodeImage: "",
};

export default function AdminEventsPanel() {
  const { items: stored, loaded, error: loadError } = useCollectionState(eventsStore);
  const [saving, setSaving] = useState(false);
  const events = useMemo(() => [...stored].sort((a, b) => String(a.date).localeCompare(String(b.date))), [stored]);
  const [formState, setFormState] = useState(null);
  const { notice, show, clear } = useNotice();

  const types = [...new Set(events.map((item) => item.type).filter(Boolean))];
  const todayIso = new Date().toISOString().slice(0, 10);

  const update = (field, value) => setFormState((current) => ({ ...current, [field]: value }));
  const openAdd = () => { clear(); setFormState({ id: null, ...emptyEvent }); };
  const openEdit = (event) => { clear(); setFormState({ ...event }); };
  const closeForm = () => setFormState(null);

  const handleSave = async (submitEvent) => {
    submitEvent.preventDefault();
    if (formState.applicationSheetUrl && !isHttpUrl(formState.applicationSheetUrl)) {
      return show("error", "The application link must start with http:// or https://");
    }

    const adding = !formState.id;
    setSaving(true);
    try {
      if (adding) await eventsAdmin.create(formState);
      else await eventsAdmin.update(formState.id, formState);
      closeForm();
      show("success", adding ? "Event added to the calendar." : "Event updated.");
    } catch (error) {
      show("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.name}"?`)) return;
    try {
      await eventsAdmin.remove(event.id);
      show("success", "Event deleted.");
    } catch (error) {
      show("error", error.message);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Events</h2>
          <p className="admin-table-subtext">Events appear on the calendar, the upcoming list and their own detail page.</p>
        </div>
        <button className="btn btn-accent" onClick={openAdd}>+ Add event</button>
      </div>

      {loadError && <p className="admin-notice admin-notice-error">{loadError}</p>}
      {notice && <p className={`admin-notice admin-notice-${notice.type}`} role="status">{notice.text}</p>}

      {formState && (
        <form className="admin-form" onSubmit={handleSave}>
          <h3 className="admin-form-title">{formState.id ? `Editing ${formState.name}` : "New event"}</h3>
          <div className="admin-form-row-2">
            <label>Event name<input value={formState.name} onChange={(e) => update("name", e.target.value)} required /></label>
            <label>Type
              <input list="event-types" value={formState.type} onChange={(e) => update("type", e.target.value)} placeholder="Grading, Competition, Training camp…" required />
              <datalist id="event-types">{types.map((type) => <option key={type} value={type} />)}</datalist>
            </label>
          </div>
          <div className="admin-form-row-2">
            <label>Date<input type="date" value={formState.date} onChange={(e) => update("date", e.target.value)} required /></label>
            <label>Location<input value={formState.location} onChange={(e) => update("location", e.target.value)} required /></label>
          </div>
          <label>Description<textarea rows="3" value={formState.description} onChange={(e) => update("description", e.target.value)} /></label>

          <ImageUploadField
            label="Event image"
            value={formState.image}
            onChange={(value) => update("image", value || DEFAULT_EVENT_IMAGE)}
            removeLabel="Use default image"
            onError={(text) => show("error", text)}
          />

          <label>Google Sheets application link (optional)
            <input type="url" value={formState.applicationSheetUrl} onChange={(e) => update("applicationSheetUrl", e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." />
          </label>

          <ImageUploadField
            label="Application QR code (optional)"
            value={formState.qrCodeImage}
            onChange={(value) => update("qrCodeImage", value)}
            format="qr"
            removeLabel="Remove QR code"
            hint="Upload the QR code as an image (PNG or JPG). It is shown on the event page for members to scan."
            onError={(text) => show("error", text)}
          />

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving…" : formState.id ? "Save changes" : "Add event"}</button>
            <button type="button" className="btn btn-outline-dark" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Event</th><th>Date</th><th>Location</th><th>Application</th><th /></tr></thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td><img className="admin-thumb" src={event.image} alt="" /></td>
                <td><strong>{event.name}</strong><div className="admin-table-subtext">{event.type}</div></td>
                <td>{formatDate(event.date)}{event.date && event.date < todayIso && <span className="admin-badge admin-badge-muted">Past</span>}</td>
                <td>{event.location}</td>
                <td>
                  {event.applicationSheetUrl && <span className="admin-badge">Form</span>}
                  {event.qrCodeImage && <span className="admin-badge">QR</span>}
                  {!event.applicationSheetUrl && !event.qrCodeImage && <span className="admin-muted">None</span>}
                </td>
                <td className="admin-table-actions"><button onClick={() => openEdit(event)}>Edit</button><button className="danger" onClick={() => handleDelete(event)}>Delete</button></td>
              </tr>
            ))}
            {!loaded && <tr><td colSpan="6" className="admin-empty-cell">Loading…</td></tr>}
            {loaded && events.length === 0 && <tr><td colSpan="6" className="admin-empty-cell">No events yet. Add your first event.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
