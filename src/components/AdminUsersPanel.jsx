import { useEffect, useState } from "react";
import { getProfilesForAdmin } from "../services/profilesService";

function formatRole(role) {
  if (role === "administrator") return "Administrator";
  if (role === "guardian") return "Parent / Guardian";
  if (role === "athlete") return "Athlete";
  return role || "—";
}

export default function AdminUsersPanel() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProfiles() {
      try {
        setLoading(true);
        setErrorMessage("");
        const data = await getProfilesForAdmin();
        if (isMounted) setProfiles(data);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Failed to load profiles.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Users</h2>
      </div>

      <p className="admin-table-subtext" style={{ marginBottom: "20px", fontSize: "14px" }}>
        Authentication is managed by Supabase Auth. Passwords and administrator assignment are not managed in the browser.
      </p>

      {errorMessage && <p className="auth-error">{errorMessage}</p>}
      {loading && <p className="simple-page">Loading user profiles...</p>}

      {!loading && !errorMessage && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: "24px" }}>
                  No user profiles found.
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>
                    {profile.firstName || profile.lastName
                      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
                      : "Unnamed User"}
                  </td>
                  <td>{formatRole(profile.role)}</td>
                  <td>
                    <span
                      className={`admin-status ${
                        profile.isActive !== false
                          ? "admin-status-confirmed"
                          : "admin-status-cancelled"
                      }`}
                    >
                      {profile.isActive !== false ? "Active" : "Inactive"}
                    </span>
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
