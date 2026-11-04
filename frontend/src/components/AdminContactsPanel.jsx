import { useEffect, useRef, useState } from "react";
import AdminLoadingButton from "./AdminLoadingButton";
import { useCollectionState } from "../hooks/useCollection";
import useNotice from "../hooks/useNotice";
import { deleteMessage, isUnread, markAllMessagesRead, messagesStore, setMessageStatus } from "../data/messages";
import { formatDateTime, toTelHref } from "../lib/format";

export default function AdminContactsPanel() {
  const { items: messages, loaded, error: loadError } = useCollectionState(messagesStore);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const confirmDialogRef = useRef(null);
  const { notice, show } = useNotice();

  useEffect(() => {
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    if (confirmMessage && !dialog.open) dialog.showModal();
    if (!confirmMessage && dialog.open) dialog.close();
  }, [confirmMessage]);

  const unread = messages.filter(isUnread).length;
  const visible = filter === "unread" ? messages.filter(isUnread) : messages;

  const run = async (action, successText, actionId) => {
    if (busyAction) return;
    setBusyAction(actionId);
    try {
      await action();
      if (successText) show("success", successText);
    } catch (error) {
      show("error", error.message);
    } finally {
      setBusyAction(null);
    }
  };

  const setStatus = (id, status) => run(() => setMessageStatus(id, status), null, `status-${id}`);

  const toggleOpen = (message) => {
    const opening = openId !== message.id;
    setOpenId(opening ? message.id : null);
    if (opening && isUnread(message)) setStatus(message.id, "read");
  };

  const handleDelete = async () => {
    if (!confirmMessage || busyAction) return;

    const messageToDelete = confirmMessage;
    setDeletingMessageId(messageToDelete.id);
    setBusyAction(`delete-${messageToDelete.id}`);

    try {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await new Promise((resolve) => window.setTimeout(resolve, 420));
      }
      await deleteMessage(messageToDelete.id);
      setConfirmMessage(null);
      show("success", "Message deleted.");
    } catch (error) {
      show("error", error.message);
    } finally {
      setDeletingMessageId(null);
      setBusyAction(null);
    }
  };

  const replyHref = (message) => {
    const subject = encodeURIComponent("Re: your message to West Rand Judo Association");
    const body = encodeURIComponent(`Hi ${message.name.split(" ")[0]},\n\n\n\n---\nYou wrote:\n${message.message}`);
    return `mailto:${message.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Contact messages</h2>
          <p className="admin-table-subtext">Enquiries from the Contact page, event pages, instructor profiles and store orders.</p>
        </div>
        {unread > 0 && (
          <AdminLoadingButton className="btn btn-outline-dark" onClick={() => run(markAllMessagesRead, "All messages marked as read.", "mark-all-read")} loading={busyAction === "mark-all-read"} disabled={Boolean(busyAction)} loadingText="Marking read…">
            Mark all read
          </AdminLoadingButton>
        )}
      </div>

      {loadError && <p className="admin-notice admin-notice-error">{loadError}</p>}
      {notice && <p className={`admin-notice admin-notice-${notice.type}`} role="status">{notice.text}</p>}

      <div className="admin-filter-chips">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <span>{messages.length}</span></button>
        <button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>Unread <span>{unread}</span></button>
      </div>

      <div className="admin-messages-list">
        {!loaded && <div className="admin-empty-state"><p>Loading…</p></div>}
        {loaded && visible.length === 0 && (
          <div className="admin-empty-state">
            <strong>{filter === "unread" ? "No unread messages" : "Inbox is empty"}</strong>
            <p>{filter === "unread" ? "You're all caught up." : "Messages sent through the public forms will appear here."}</p>
          </div>
        )}

        {visible.map((message) => {
          const isOpen = openId === message.id;
          const fresh = isUnread(message);
          return (
            <article
              key={message.id}
              className={`admin-message-card ${fresh ? "admin-message-unread" : ""} ${deletingMessageId === message.id ? "admin-message-card-deleting" : ""}`}
            >
              <button className="admin-message-header" onClick={() => toggleOpen(message)} aria-expanded={isOpen}>
                <div>
                  <p className="admin-message-name">{fresh && <i className="admin-unread-dot" />}{message.name}</p>
                  <p className="admin-message-email">{message.email}{message.phone ? ` · ${message.phone}` : ""}</p>
                </div>
                <div className="admin-message-meta">
                  {message.source && <span className="admin-badge">{message.source}</span>}
                  <span className="admin-message-date">{formatDateTime(message.createdAt || message.date)}</span>
                </div>
              </button>
              <p className={`admin-message-body ${isOpen ? "open" : ""}`}>{message.message}</p>
              {isOpen && (
                <div className="admin-message-actions">
                  <a className="btn btn-accent" href={replyHref(message)}>Reply by email</a>
                  {message.phone && <a className="btn btn-outline-dark" href={toTelHref(message.phone)}>Call</a>}
                  <AdminLoadingButton className="admin-link-button" onClick={() => setStatus(message.id, fresh ? "read" : "new")} loading={busyAction === `status-${message.id}`} disabled={Boolean(busyAction)} loadingText={fresh ? "Marking read…" : "Marking unread…"}>{fresh ? "Mark as read" : "Mark as unread"}</AdminLoadingButton>
                  <button className="admin-link-button danger" onClick={() => setConfirmMessage(message)} disabled={Boolean(deletingMessageId)}>Delete</button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <dialog
        ref={confirmDialogRef}
        className="admin-confirm-dialog"
        onCancel={(event) => { event.preventDefault(); setConfirmMessage(null); }}
      >
        {confirmMessage && (
          <div className="admin-confirm-content">
            <p className="admin-confirm-kicker">DELETE MESSAGE</p>
            <h2>Delete this message?</h2>
            <p>The message from {confirmMessage.name} will be permanently deleted.</p>
            <div className="admin-confirm-actions">
              <button type="button" className="btn btn-outline-dark" onClick={() => setConfirmMessage(null)} disabled={Boolean(deletingMessageId)}>Cancel</button>
              <AdminLoadingButton className="btn admin-confirm-delete" onClick={handleDelete} loading={Boolean(deletingMessageId)} disabled={Boolean(busyAction) && !deletingMessageId} loadingText="Deleting message…">Delete message</AdminLoadingButton>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
