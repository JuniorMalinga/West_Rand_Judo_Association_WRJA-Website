import { useEffect, useState } from "react";
import {
  getEventsForAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/eventsService";

const emptyEvent = {
  name: "",
  type: "competition",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  description: "",
  registrationDeadline: "",
  status: "draft",
  entryFormPath: "",
  imagePath: "",
};

function getStatusClass(status) {
  if (status === "published") return "admin-status-confirmed";
  if (status === "draft") return "admin-status-pending";
  if (status === "cancelled") return "admin-status-cancelled";
  if (status === "completed") return "admin-status-paid";
  return "";
}

function formatStatus(status) {
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminEventsPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelError, setPanelError] = useState("");
  const [formState, setFormState] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load events from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        setLoading(true);
        setPanelError("");
        const data = await getEventsForAdmin();
        if (isMounted) setEvents(data);
      } catch (err) {
        console.error("Failed to load events for admin:", err);
        if (isMounted) setPanelError(err.message || "Failed to load events.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAddForm = () => {
    setFormError("");
    setFormState({ id: null, ...emptyEvent });
  };

  const openEditForm = (event) => {
    setFormError("");
    setFormState({
      id: event.id,
      name: event.title || event.name || "",
      type: event.type || "competition",
      date: event.date || "",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      location: event.location || "",
      description: event.description || "",
      registrationDeadline: event.registrationDeadline || "",
      status: event.status || "draft",
      entryFormPath: event.entryFormPath || "",
      imagePath: event.imagePath || "",
    });
  };

  const closeForm = () => {
    setFormState(null);
    setFormError("");
  };

  const handleFieldChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      if (formState.id) {
        const updated = await updateEvent(formState.id, formState);
        setEvents((current) =>
          current.map((item) => (item.id === formState.id ? updated : item))
        );
      } else {
        const created = await createEvent(formState);
        setEvents((current) => [created, ...current]);
      }
      closeForm();
    } catch (err) {
      console.error("Error saving event:", err);
      setFormError(err.message || "Failed to save event. Check your inputs.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteEvent(id);
      setEvents((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting event:", err);
      setPanelError(err.message || "Failed to delete event.");
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

      {panelError && <p className="auth-error">{panelError}</p>}
      {loading && <p className="simple-page">Loading events from Supabase...</p>}

      {formState && (
        <form className="admin-form" onSubmit={handleSave}>
          <div className="admin-form-row-2">
            <label>
              Event title
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  handleFieldChange("name", event.target.value)
                }
                placeholder="e.g. West Rand Open Championships"
                required
              />
            </label>

            <label>
              Event type
              <select
                value={formState.type}
                onChange={(event) =>
                  handleFieldChange("type", event.target.value)
                }
                required
              >
                <option value="competition">Competition</option>
                <option value="grading">Grading</option>
                <option value="training_camp">Training Camp</option>
              </select>
            </label>
          </div>

          <div className="admin-form-row-2">
            <label>
              Event date
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
                placeholder="e.g. Kagiso Dojo, Krugersdorp"
              />
            </label>
          </div>

          <div className="admin-form-row-2">
            <label>
              Start time (optional)
              <input
                type="time"
                value={formState.startTime}
                onChange={(event) =>
                  handleFieldChange("startTime", event.target.value)
                }
              />
            </label>

            <label>
              End time (optional)
              <input
                type="time"
                value={formState.endTime}
                onChange={(event) =>
                  handleFieldChange("endTime", event.target.value)
                }
              />
            </label>
          </div>

          <div className="admin-form-row-2">
            <label>
              Registration deadline (optional)
              <input
                type="date"
                value={formState.registrationDeadline}
                onChange={(event) =>
                  handleFieldChange("registrationDeadline", event.target.value)
                }
              />
            </label>

            <label>
              Status
              <select
                value={formState.status}
                onChange={(event) =>
                  handleFieldChange("status", event.target.value)
                }
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          <label>
            Description
            <textarea
              rows="3"
              value={formState.description}
              onChange={(event) =>
                handleFieldChange("description", event.target.value)
              }
              placeholder="Details about the event, weight categories, rules, or requirements..."
            />
          </label>

          <div className="admin-form-row-2">
            <label>
              Entry form document path (Storage)
              <input
                type="text"
                value={formState.entryFormPath}
                onChange={(event) =>
                  handleFieldChange("entryFormPath", event.target.value)
                }
                placeholder="e.g. events/entry-forms/tournament-2026.pdf"
              />
            </label>

            <label>
              Cover image path (Storage)
              <input
                type="text"
                value={formState.imagePath}
                onChange={(event) =>
                  handleFieldChange("imagePath", event.target.value)
                }
                placeholder="e.g. events/flyers/championship-cover.jpg"
              />
            </label>
          </div>

          {formError && <p className="auth-error">{formError}</p>}

          <div className="admin-form-actions">
            <button
              type="submit"
              className="btn btn-accent"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : formState.id
                ? "Save changes"
                : "Add event"}
            </button>

            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={closeForm}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Date</th>
              <th>Location</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "24px" }}
                >
                  No events found.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td>
                    {event.name}
                    {event.startTime && (
                      <div className="admin-table-subtext">
                        {event.startTime.slice(0, 5)}
                        {event.endTime
                          ? ` - ${event.endTime.slice(0, 5)}`
                          : ""}
                      </div>
                    )}
                  </td>
                  <td>{event.displayType || event.type}</td>
                  <td>{event.date}</td>
                  <td>{event.location || "—"}</td>
                  <td>
                    <span
                      className={`admin-status ${getStatusClass(
                        event.status
                      )}`}
                    >
                      {formatStatus(event.status)}
                    </span>
                  </td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      onClick={() => openEditForm(event)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}