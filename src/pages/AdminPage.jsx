import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminOverviewPanel from "../components/AdminOverviewPanel";
import AdminEventsPanel from "../components/AdminEventsPanel";
import AdminNewsPanel from "../components/AdminNewsPanel";
import AdminContactsPanel from "../components/AdminContactsPanel";
import AdminUsersPanel from "../components/AdminUsersPanel";
import AdminCompetitionsPanel from "../components/AdminCompetitionsPanel";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { slug: "overview", label: "Overview", icon: "⌂" },
  { slug: "competitions", label: "Competitions", icon: "◆" },
  { slug: "events", label: "Events", icon: "◷" },
  { slug: "messages", label: "Messages", icon: "✉" },
  { slug: "users", label: "Users", icon: "♙" },
  { slug: "news", label: "News", icon: "▤" },
];

export default function AdminPage() {
  const { isAdmin, displayName, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const handleTabRequest = (event) => setActiveTab(event.detail || "overview");
    window.addEventListener("wrja:admin-tab", handleTabRequest);
    return () => window.removeEventListener("wrja:admin-tab", handleTabRequest);
  }, []);

  if (!isAdmin) return <Navigate to="/login" replace />;

  const goTo = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const ActivePanel = { competitions: AdminCompetitionsPanel, events: AdminEventsPanel, messages: AdminContactsPanel, users: AdminUsersPanel, news: AdminNewsPanel }[activeTab];

  return (
    <div className="admin-console">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span className="admin-brand-mark">W</span><div><strong>WRJA</strong><small>ADMIN CONSOLE</small></div></div>
        <div className="admin-sidebar-label">Workspace</div>
        <nav className="admin-side-nav">{tabs.map((tab) => <button key={tab.slug} className={activeTab === tab.slug ? "admin-side-link active" : "admin-side-link"} onClick={() => goTo(tab.slug)}><span>{tab.icon}</span>{tab.label}{tab.slug === "messages" && <em>Inbox</em>}</button>)}</nav>
        <div className="admin-sidebar-footer"><div className="admin-profile"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><b>{displayName}</b><small>Administrator</small></div></div><button className="admin-signout" onClick={signOut}>Sign out <span>↗</span></button></div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar"><div><p className="eyebrow">WRJA WEBSITE / ADMIN</p><h1>{tabs.find((tab) => tab.slug === activeTab)?.label}</h1></div><div className="admin-topbar-actions"><span className="admin-live-pill"><i /> Live preview</span><button className="admin-refresh" onClick={() => { setNotice("Data refreshed from this browser"); window.setTimeout(() => setNotice(""), 2400); }}>Refresh data</button></div></header>
        {notice && <div className="admin-toast" role="status">{notice}</div>}
        {activeTab === "overview" ? <AdminOverviewPanel onNavigate={goTo} /> : <section className="admin-panel-wrap"><ActivePanel /></section>}
      </main>
    </div>
  );
}
