import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { profile } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState("");
  const [deletionError, setDeletionError] = useState("");
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  const updatePasswordField = (field) => (event) => {
    setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
    setPasswordError("");
    setPasswordStatus("");
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8
      || !/[A-Za-z]/.test(passwordForm.newPassword)
      || !/\d/.test(passwordForm.newPassword)) {
      setPasswordError("Your new password must be at least 8 characters and include a letter and a number.");
      return;
    }

    setChangingPassword(true);
    setPasswordError("");
    setPasswordStatus("");
    try {
      await api("/api/profile/change-password", {
        method: "POST",
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus("Your password has been changed.");
    } catch (requestError) {
      setPasswordError(requestError.message || "Unable to change your password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const requestAccountDeletion = async () => {
    const confirmed = window.confirm(
      "Send WRJA a request to review deletion of your website account? Your account will stay active until WRJA processes the request."
    );
    if (!confirmed) return;

    setRequestingDeletion(true);
    setDeletionError("");
    setDeletionStatus("");
    try {
      await api("/api/profile/deletion-request", { method: "POST", body: {} });
      setDeletionStatus("Your request was sent to WRJA for review. Your account remains active until WRJA follows up and processes it.");
    } catch (requestError) {
      setDeletionError(requestError.message || "Unable to send your account deletion request.");
    } finally {
      setRequestingDeletion(false);
    }
  };

  return (
    <div className="profile-page">
      <PageHeader title="My profile" />
      <main className="profile-content">
        <section className="profile-card" aria-labelledby="profile-account-heading">
          <p className="eyebrow">MEMBER ACCOUNT</p>
          <h2 id="profile-account-heading">Account details</h2>
          {profile ? (
            <dl className="profile-details">
              <div><dt>Name</dt><dd>{profile.firstName} {profile.lastName}</dd></div>
              <div><dt>Email</dt><dd>{profile.email}</dd></div>
              <div><dt>Phone</dt><dd>{profile.phone || "Not provided"}</dd></div>
              <div><dt>Account type</dt><dd>{profile.role}</dd></div>
            </dl>
          ) : <p>Loading account details…</p>}
        </section>

        <section className="profile-card" aria-labelledby="profile-password-heading">
          <p className="eyebrow">ACCOUNT SECURITY</p>
          <h2 id="profile-password-heading">Change password</h2>
          <form className="profile-password-form" onSubmit={changePassword}>
            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={updatePasswordField("currentPassword")}
                required
              />
            </label>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                minLength="8"
                value={passwordForm.newPassword}
                onChange={updatePasswordField("newPassword")}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                minLength="8"
                value={passwordForm.confirmPassword}
                onChange={updatePasswordField("confirmPassword")}
                required
              />
            </label>
            <p className="profile-note">Use at least 8 characters with a letter and a number.</p>
            <button type="submit" className="btn btn-accent" disabled={changingPassword}>
              {changingPassword ? "Changing password…" : "Change password"}
            </button>
          </form>
          {passwordStatus && <p className="profile-success" role="status">{passwordStatus}</p>}
          {passwordError && <p className="profile-error" role="alert">{passwordError}</p>}
        </section>

        <section className="profile-card profile-deletion-card" aria-labelledby="profile-deletion-heading">
          <p className="eyebrow">ACCOUNT CONTROL</p>
          <h2 id="profile-deletion-heading">Request account deletion</h2>
          <p>
            Send WRJA a request to review account deletion. Your account is not deleted
            immediately; WRJA will follow up and handle the request under its retention
            obligations.
          </p>
          <button type="button" className="btn btn-outline-dark" onClick={requestAccountDeletion} disabled={requestingDeletion}>
            {requestingDeletion ? "Sending request…" : "Request account deletion"}
          </button>
          {deletionStatus && <p className="profile-success" role="status">{deletionStatus}</p>}
          {deletionError && <p className="profile-error" role="alert">{deletionError}</p>}
        </section>
      </main>
    </div>
  );
}
