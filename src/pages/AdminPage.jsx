import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminOverviewPanel from "../components/AdminOverviewPanel";
import AdminEventsPanel from "../components/AdminEventsPanel";
import AdminNewsPanel from "../components/AdminNewsPanel";
import AdminContactsPanel from "../components/AdminContactsPanel";
import AdminUsersPanel from "../components/AdminUsersPanel";
import AdminCompetitionsPanel from "../components/AdminCompetitionsPanel";
import AdminPaymentsPanel from "../components/AdminPaymentsPanel";
import { useAuth } from "../context/AuthContext";
import useAdminCounts from "../hooks/useAdminCounts";
import { competitionsStore } from "../data/competitions";
import { eventsStore } from "../data/events";
import { newsStore } from "../data/newsPosts";
import { messagesStore } from "../data/messages";
import { paymentsStore } from "../data/payments";
import { usersStore } from "../data/users";

const tabs = [
  { slug: "overview", label: "Overview", icon: "⌂" },
  { slug: "competitions", label: "Competitions", icon: "◆" },
  { slug: "events", label: "Events", icon: "◷" },
  { slug: "news", label: "News", icon: "▤" },
  { slug: "messages", label: "Messages", icon: "✉" },
  { slug: "payments", label: "Payments", icon: "R" },
  { slug: "users", label: "Users", icon: "♙" },
];

const panels = {
  competitions: AdminCompetitionsPanel,
  events: AdminEventsPanel,
  news: AdminNewsPanel,
  messages: AdminContactsPanel,
  payments: AdminPaymentsPanel,
  users: AdminUsersPanel,
};

export default function AdminPage() {
  const { isAdmin, displayName, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { counts, refresh: refreshCounts, connectionStatus } = useAdminCounts(isAdmin);

  useEffect(() => {
    const handleTabRequest = (event) => setActiveTab(event.detail || "overview");
    window.addEventListener("wrja:admin-tab", handleTabRequest);
    return () => window.removeEventListener("wrja:admin-tab", handleTabRequest);
  }, []);

  if (!isAdmin) return <Navigate to="/login" replace />;

  const badges = { messages: counts?.unreadMessages || 0, payments: counts?.pendingPayments || 0 };

  const goTo = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reload every list from the server, then remount the panel.
  const refresh = () => {
    [competitionsStore, eventsStore, newsStore, messagesStore, paymentsStore, usersStore].forEach((store) => store.refresh());
    setRefreshKey((key) => key + 1);
    refreshCounts();
    setNotice("Data refreshed");
    window.setTimeout(() => setNotice(""), 2400);
  };

  const ActivePanel = panels[activeTab];

  return (
    <div className="admin-console">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span className="admin-brand-mark">W</span><div><strong>WRJA</strong><small>ADMIN CONSOLE</small></div></div>
        <div className="admin-sidebar-label">Workspace</div>
        <nav className="admin-side-nav">
          {tabs.map((tab) => (
            <button key={tab.slug} className={activeTab === tab.slug ? "admin-side-link active" : "admin-side-link"} onClick={() => goTo(tab.slug)}>
              <span>{tab.icon}</span>{tab.label}
              {badges[tab.slug] > 0 && <em className="admin-side-badge">{badges[tab.slug]}</em>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-profile"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><b>{displayName}</b><small>Administrator</small></div></div>
          <button className="admin-signout" onClick={signOut}>Sign out <span>↗</span></button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div><p className="eyebrow">WRJA WEBSITE / ADMIN</p><h1>{tabs.find((tab) => tab.slug === activeTab)?.label}</h1></div>
          <div className="admin-topbar-actions">
            <span className="admin-live-pill"><i /> Live database</span>
            <button className="admin-refresh" onClick={refresh}>Refresh data</button>
          </div>
        </header>
        {notice && <div className="admin-toast" role="status">{notice}</div>}
        {activeTab === "overview"
          ? <AdminOverviewPanel key={refreshKey} counts={counts} connectionStatus={connectionStatus} onNavigate={goTo} />
          : <section className="admin-panel-wrap"><ActivePanel key={`${activeTab}-${refreshKey}`} /></section>}
      </main>
    </div>
  );
}
