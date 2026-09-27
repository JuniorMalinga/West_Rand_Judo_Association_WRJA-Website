import { useState } from "react";
import seedEvents from "../data/events";

const EVENTS_KEY = "wrja.events";
const readEvents = () => {
  try { return JSON.parse(window.localStorage.getItem(EVENTS_KEY)) || seedEvents; } catch { return seedEvents; }
};
const saveEvents = (events) => { window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); window.dispatchEvent(new Event("wrja:events-updated")); };

const emptyEvent = {
  name: "",
  type: "",
  date: "",
  location: "",
  description: "",
  applicationSheetUrl: "",
  qrCodeImage: "",
};

export default function AdminEventsPanel() {
  const [events, setEvents] = useState(() => readEvents().map((event) => ({ ...event })));
  const [formState, setFormState] = useState(null);

  const openAddForm = () => setFormState({ id: null, ...emptyEvent });
  const openEditForm = (event) => setFormState({ ...event });
  const closeForm = () => setFormState(null);

  const handleFieldChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    const next = formState.id ? events.map((item) => item.id === formState.id ? formState : item) : [...events, { ...formState, id: Date.now() }];
    setEvents(next);
    saveEvents(next);
    closeForm();
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this event?")) {
      setEvents((current) => { const next = current.filter((item) => item.id !== id); saveEvents(next); return next; });
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Events</h2>
        <button className="btn btn-accent" onClick={openAddForm}>
          + Add event
        </button>
      </div>

      {formState && (
        <form className="admin-form" onSubmit={handleSave}>
          <div className="admin-form-row-2">
            <label>
              Event name
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  handleFieldChange("name", event.target.value)
                }
                required
              />
            </label>

            <label>
              Type
              <input
                type="text"
                value={formState.type}
                onChange={(event) =>
                  handleFieldChange("type", event.target.value)
                }
                placeholder="Grading, Competition, Training camp..."
                required
              />
            </label>
          </div>

          <div className="admin-form-row-2">
            <label>
              Date
              <input
                type="date"
                value={formState.date}
                onChange={(event) =>
                  handleFieldChange("date", event.target.value)
                }
                required
              />
            </label>

            <label>
              Location
              <input
                type="text"
                value={formState.location}
                onChange={(event) =>
                  handleFieldChange("location", event.target.value)
                }
                required
              />
            </label>
          </div>

          {/* event description field */}
          <label>
            Description
            <textarea
              rows="3"
              value={formState.description}
              onChange={(event) =>
                handleFieldChange("description", event.target.value)
              }
            />
          </label>

          {/* Google Sheets application link and QR code image URL fields */}
          <div className="admin-form-row-2">
            <label>
              Google Sheets application link
              <input
                type="url"
                value={formState.applicationSheetUrl}
                onChange={(event) =>
                  handleFieldChange(
                    "applicationSheetUrl",
                    event.target.value
                  )
                }
                placeholder="https://docs.google.com/spreadsheets/..."
              />
            </label>

            <label>
              QR code image URL
              <input
                type="url"
                value={formState.qrCodeImage}
                onChange={(event) =>
                  handleFieldChange("qrCodeImage", event.target.value)
                }
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-accent">
              {formState.id ? "Save changes" : "Add event"}
            </button>

            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={closeForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Date</th>
            <th>Location</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.name}</td>
              <td>{event.type}</td>
              <td>{event.date}</td>
              <td>{event.location}</td>
              <td className="admin-table-actions">
                <button onClick={() => openEditForm(event)}>
                  Edit
                </button>

                <button onClick={() => handleDelete(event.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
