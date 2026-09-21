import { useEffect, useState } from "react";
import {
  getTrialRequestsForAdmin,
  updateTrialRequestStatus,
  deleteTrialRequest,
} from "../services/trialRequestsService";

const bookingStatuses = ["Pending", "Confirmed", "Declined", "Cancelled"];

function getStatusClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "admin-status-confirmed";
  if (s === "pending") return "admin-status-pending";
  if (s === "declined" || s === "cancelled") return "admin-status-cancelled";
  return "";
}

export default function AdminBookingsPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelError, setPanelError] = useState("");

  // Load trial booking requests on mount
  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      try {
        setLoading(true);
        setPanelError("");
        const data = await getTrialRequestsForAdmin();
        if (isMounted) setBookings(data);
      } catch (err) {
        console.error("Failed to load trial requests for admin:", err);
        if (isMounted)
          setPanelError(err.message || "Failed to load booking requests.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setPanelError("");

    try {
      // Persist to Supabase first before updating UI state
      await updateTrialRequestStatus(id, newStatus);

      setBookings((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: newStatus.toLowerCase(),
                displayStatus: newStatus,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to update booking status:", err);
      setPanelError(err.message || "Failed to update status in database.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking request?"))
      return;

    setPanelError("");

    try {
      // Delete in Supabase first before updating UI state
      await deleteTrialRequest(id);
      setBookings((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete booking request:", err);
      setPanelError(err.message || "Failed to delete booking request.");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Bookings &amp; Trial Requests</h2>
      </div>

      {panelError && <p className="auth-error">{panelError}</p>}
      {loading && (
        <p className="simple-page">Loading booking requests from Supabase...</p>
      )}

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Program</th>
              <th>Instructor</th>
              <th>Preferred</th>
              <th>Payment method</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "24px" }}
                >
                  No booking requests found.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    {booking.fullName}
                    <div className="admin-table-subtext">
                      {booking.email} &middot; {booking.phone}
                    </div>
                    {booking.notes && (
                      <div
                        className="admin-table-subtext"
                        style={{ fontStyle: "italic", marginTop: "4px" }}
                      >
                        Notes: &ldquo;{booking.notes}&rdquo;
                      </div>
                    )}
                  </td>
                  <td>{booking.programName}</td>
                  <td>{booking.instructor}</td>
                  <td>
                    {booking.preferredDate} {booking.preferredTime}
                  </td>
                  <td>{booking.paymentMethod}</td>
                  <td>
                    <select
                      value={booking.displayStatus}
                      onChange={(event) =>
                        handleStatusChange(booking.id, event.target.value)
                      }
                      className={`admin-status ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      {bookingStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      onClick={() => handleDelete(booking.id)}
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