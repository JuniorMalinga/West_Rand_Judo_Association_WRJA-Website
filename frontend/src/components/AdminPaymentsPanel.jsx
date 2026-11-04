import { useState } from "react";
import AdminLoadingButton, { AdminActionSpinner } from "./AdminLoadingButton";
import { useCollectionState } from "../hooks/useCollection";
import useNotice from "../hooks/useNotice";
import { deletePayment, PAYMENT_STATUSES, paymentFileUrl, paymentsStore, pendingPayments, setPaymentStatus } from "../data/payments";
import { formatDateTime } from "../lib/format";

const statusClass = (status) => `admin-badge admin-badge-${status === "Approved" ? "ok" : status === "Rejected" ? "bad" : "warn"}`;

export default function AdminPaymentsPanel() {
  const { items: payments, loaded, error: loadError } = useCollectionState(paymentsStore);
  const [filter, setFilter] = useState("pending");
  const [busyAction, setBusyAction] = useState(null);
  const { notice, show } = useNotice();

  const pending = pendingPayments(payments).length;
  const visible = filter === "pending" ? payments.filter((p) => p.status === "Submitted for review") : payments;

  const run = async (actionId, action, text) => {
    if (busyAction) return;
    setBusyAction(actionId);
    try {
      await action();
      if (text) show("success", text);
    } catch (error) {
      show("error", error.message);
    } finally {
      setBusyAction(null);
    }
  };

  const setStatus = (id, status) => run(`status-${id}`, () => setPaymentStatus(id, status), `Marked as ${status.toLowerCase()}.`);

  const handleDelete = (payment) => {
    if (window.confirm(`Delete the proof of payment from ${payment.userName}?`)) {
      run(`delete-${payment.id}`, () => deletePayment(payment.id), "Submission deleted.");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Proof of payment</h2>
          <p className="admin-table-subtext">EFT confirmations uploaded by members. Open the file, then approve or reject it.</p>
        </div>
      </div>

      {loadError && <p className="admin-notice admin-notice-error">{loadError}</p>}
      {notice && <p className={`admin-notice admin-notice-${notice.type}`} role="status">{notice.text}</p>}

      <div className="admin-filter-chips">
        <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Needs review <span>{pending}</span></button>
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <span>{payments.length}</span></button>
      </div>

      {!loaded ? (
        <div className="admin-empty-state"><p>Loading…</p></div>
      ) : visible.length === 0 ? (
        <div className="admin-empty-state">
          <strong>{filter === "pending" ? "Nothing waiting for review" : "No submissions yet"}</strong>
          <p>Members upload proof of payment from a competition's payment page.</p>
        </div>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th>Member</th><th>For</th><th>File</th><th>Uploaded</th><th>Status</th><th /></tr></thead>
            <tbody>
              {visible.map((payment) => (
                <tr key={payment.id}>
                  <td><strong>{payment.userName}</strong><div className="admin-table-subtext">{payment.userEmail}</div></td>
                  <td>{payment.competitionName}</td>
                  <td>
                    <a href={paymentFileUrl(payment.id)} target="_blank" rel="noopener noreferrer">View</a>
                    {" · "}
                    <a href={paymentFileUrl(payment.id)} download={payment.fileName}>Download</a>
                    <div className="admin-table-subtext">{payment.fileName}</div>
                  </td>
                  <td>{formatDateTime(payment.uploadedAt)}</td>
                  <td>
                    <span className={statusClass(payment.status)}>{payment.status}</span>
                    <select className="admin-inline-select" value={payment.status} onChange={(e) => setStatus(payment.id, e.target.value)} aria-label="Change status" disabled={Boolean(busyAction)}>
                      {PAYMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    {busyAction === `status-${payment.id}` && <span role="status" aria-label="Updating payment status"><AdminActionSpinner /></span>}
                  </td>
                  <td className="admin-table-actions">
                    <AdminLoadingButton onClick={() => setStatus(payment.id, "Approved")} loading={busyAction === `status-${payment.id}`} loadingText="Approving…" disabled={Boolean(busyAction) || payment.status === "Approved"}>Approve</AdminLoadingButton>
                    <AdminLoadingButton className="danger" onClick={() => handleDelete(payment)} loading={busyAction === `delete-${payment.id}`} loadingText="Deleting…" disabled={Boolean(busyAction)}>Delete</AdminLoadingButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
