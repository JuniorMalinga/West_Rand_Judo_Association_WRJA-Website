import { useState } from "react";
import PageHeader from "../components/PageHeader";
import AdminEventsPanel from "../components/AdminEventsPanel";
import AdminNewsPanel from "../components/AdminNewsPanel";
import AdminBookingsPanel from "../components/AdminBookingsPanel";
import AdminContactsPanel from "../components/AdminContactsPanel";
import AdminUsersPanel from "../components/AdminUsersPanel";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { slug: "events", label: "Events", Component: AdminEventsPanel },
  { slug: "news", label: "News", Component: AdminNewsPanel },
  { slug: "bookings", label: "Bookings & Payments", Component: AdminBookingsPanel },
  { slug: "messages", label: "Messages", Component: AdminContactsPanel },
  { slug: "users", label: "Users", Component: AdminUsersPanel },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("events");
  const { isAdmin, loading } = useAuth();
  const ActivePanel = tabs.find((tab) => tab.slug === activeTab).Component;

  if (loading) {
    return (
      <div className="admin-page">
        <PageHeader title="Admin" />
        <section className="admin-section">
          <p className="simple-page">Checking administrator access...</p>
        </section>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className="admin-page">
      <PageHeader title="Admin" />

      <section className="admin-section">
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.slug}
              className={activeTab === tab.slug ? "admin-tab-active" : ""}
              onClick={() => setActiveTab(tab.slug)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ActivePanel />
      </section>
    </div>
  );
}