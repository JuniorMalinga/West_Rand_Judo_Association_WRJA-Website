import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCollectionState } from "../hooks/useCollection";
import useNotice from "../hooks/useNotice";
import { usersAdmin, usersStore } from "../data/users";

const emptyUser = { firstName: "", lastName: "", email: "", phone: "", password: "", role: "athlete" };
const ROLE_LABELS = { athlete: "Athlete", guardian: "Parent / Guardian", admin: "Administrator" };

export default function AdminUsersPanel() {
  const { user: currentUser } = useAuth();
  const { items: users, loaded, error: loadError } = useCollectionState(usersStore);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState(null);
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState("");
  const { notice, show } = useNotice();

  const admins = users.filter((u) => u.role === "admin");
  const visible = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const editingSelf = formState?.id && formState.id === currentUser?.id;

  const openAdd = () => { setFormError(""); setFormState({ id: null, ...emptyUser }); };
  const openEdit = (user) => { setFormError(""); setFormState({ ...user, password: "" }); };
  const closeForm = () => setFormState(null);
  const update = (field, value) => setFormState((current) => ({ ...current, [field]: value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (formState.id) {
        const { password, ...rest } = formState;
        await usersAdmin.update(formState.id, password ? { ...rest, password } : rest);
        show("success", "User updated.");
      } else {
        await usersAdmin.create(formState);
        show("success", "User added.");
      }
      closeForm();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}? They will no longer be able to log in.`)) return;
    try {
      await usersAdmin.remove(user.id);
      show("success", "User deleted.");
    } catch (error) {
      show("error", error.message);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Users</h2>
          <p className="admin-table-subtext">{users.length} accounts · {admins.length} administrator{admins.length === 1 ? "" : "s"}</p>
        </div>
        <button className="btn btn-accent" onClick={openAdd}>+ Add user</button>
      </div>

      {loadError && <p className="admin-notice admin-notice-error">{loadError}</p>}
      {notice && <p className={`admin-notice admin-notice-${notice.type}`} role="status">{notice.text}</p>}

      {formState && (
        <form className="admin-form" onSubmit={handleSave}>
          <h3 className="admin-form-title">{formState.id ? `Editing ${formState.firstName} ${formState.lastName}` : "New user"}</h3>
          <div className="admin-form-row-2">
            <label>First name<input value={formState.firstName} onChange={(e) => update("firstName", e.target.value)} required /></label>
            <label>Last name<input value={formState.lastName} onChange={(e) => update("lastName", e.target.value)} required /></label>
          </div>
          <div className="admin-form-row-2">
            <label>Email<input type="email" value={formState.email} onChange={(e) => update("email", e.target.value)} required /></label>
            <label>Phone (optional)<input type="tel" value={formState.phone || ""} onChange={(e) => update("phone", e.target.value)} /></label>
          </div>
          <div className="admin-form-row-2">
            <label>{formState.id ? "New password" : "Password"}
              <input type="text" value={formState.password} onChange={(e) => update("password", e.target.value)} required={!formState.id} minLength={formState.id && !formState.password ? undefined : 8} placeholder={formState.id ? "Leave blank to keep the current password" : "8+ characters, a letter and a number"} />
            </label>
            <label>Role
              <select value={formState.role} onChange={(e) => update("role", e.target.value)} disabled={editingSelf}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {editingSelf && <small className="admin-field-hint">You can't change your own role.</small>}
            </label>
          </div>
          {formError && <p className="admin-notice admin-notice-error">{formError}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving…" : formState.id ? "Save changes" : "Add user"}</button>
            <button type="button" className="btn btn-outline-dark" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-toolbar">
        <input type="search" className="admin-search" placeholder="Search by name, email or role…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="admin-count">{visible.length} of {users.length}</span>
      </div>

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th /></tr></thead>
          <tbody>
            {visible.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.firstName} {user.lastName}</strong>{user.id === currentUser?.id && <span className="admin-badge admin-badge-muted">You</span>}</td>
                <td>{user.email}</td>
                <td>{user.phone || <span className="admin-muted">—</span>}</td>
                <td><span className={`admin-badge ${user.role === "admin" ? "admin-badge-ok" : ""}`}>{ROLE_LABELS[user.role] || user.role}</span></td>
                <td className="admin-table-actions">
                  <button onClick={() => openEdit(user)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(user)} disabled={user.role === "admin"} title={user.role === "admin" ? "Administrators can't be deleted" : undefined}>Delete</button>
                </td>
              </tr>
            ))}
            {!loaded && <tr><td colSpan="5" className="admin-empty-cell">Loading…</td></tr>}
            {loaded && visible.length === 0 && <tr><td colSpan="5" className="admin-empty-cell">No users match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
