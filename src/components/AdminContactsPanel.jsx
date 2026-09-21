import { useState, useEffect } from "react";
import {
  getContactMessagesForAdmin,
  deleteContactMessage,
} from "../services/contactMessagesService";

export default function AdminContactsPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      try {
        setLoading(true);
        setError("");
        const data = await getContactMessagesForAdmin();
        if (isMounted) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to load contact messages:", err);
        if (isMounted) {
          setError(err.message || "Failed to load contact messages.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;

    setDeleteError("");

    try {
      // Delete from Supabase first before updating local state
      await deleteContactMessage(id);
      setMessages((current) => current.filter((message) => message.id !== id));
    } catch (err) {
      console.error("Failed to delete contact message:", err);
      setDeleteError(err.message || "Failed to delete contact message.");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Contact Messages</h2>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {deleteError && <p className="auth-error">{deleteError}</p>}

      {loading && (
        <p className="simple-page">Loading contact messages from Supabase...</p>
      )}

      {!loading && (
        <div className="admin-messages-list">
          {messages.length === 0 && <p>No messages.</p>}

          {messages.map((message) => (
            <div key={message.id} className="admin-message-card">
              <div className="admin-message-header">
                <div>
                  <p className="admin-message-name">{message.name}</p>
                  <p className="admin-message-email">
                    {message.email}
                    {message.phone && ` · ${message.phone}`}
                  </p>
                </div>
                <span className="admin-message-date">{message.date}</span>
              </div>
              <p className="admin-message-body">{message.message}</p>
              <button type="button" onClick={() => handleDelete(message.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}