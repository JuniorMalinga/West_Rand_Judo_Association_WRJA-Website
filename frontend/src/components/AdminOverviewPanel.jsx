import { useAuth } from "../context/AuthContext";
import { formatBytes } from "../lib/format";

export default function AdminOverviewPanel({ counts, connectionStatus = "checking", onNavigate }) {
  const { displayName } = useAuth();
  const c = counts || {};
  const unread = c.unreadMessages || 0;
  const pending = c.pendingPayments || 0;
  const num = (value) => (counts ? value ?? 0 : "–");
  const statusFor = (condition) => connectionStatus === "offline" ? "offline" : condition ? "warning" : connectionStatus;
  const databaseLabel = connectionStatus === "online" ? "Online" : connectionStatus === "offline" ? "Offline" : "Checking…";

  const stats = [
    { label: "Competitions", value: num(c.competitions), tone: "gold", detail: "Managed on the site" },
    { label: "Upcoming events", value: num(c.upcomingEvents), tone: "dark", detail: `${c.events ?? 0} event records` },
    { label: "Member accounts", value: num(c.members), tone: "light", detail: `${c.users ?? 0} accounts in total` },
    { label: "Unread messages", value: num(unread), tone: "light", detail: unread ? "Needs a reply" : "Inbox clear" },
  ];

  const actions = [
    { tab: "competitions", title: "Manage competitions", detail: "Registration, payment links and images" },
    { tab: "events", title: "Publish an event", detail: "Dates, venues, images and QR codes" },
    { tab: "news", title: "Post news", detail: `${c.news ?? 0} posts published` },
    { tab: "messages", title: "Review messages", detail: unread ? `${unread} unread` : "Respond to club enquiries" },
    { tab: "payments", title: "Review payments", detail: pending ? `${pending} awaiting review` : "Proof of payment uploads" },
    { tab: "users", title: "Manage members", detail: "Accounts and access roles" },
  ];

  return (
    <div className="admin-overview">
      <div className="admin-welcome-card">
        <div><p className="eyebrow">CONTROL CENTRE</p><h2>Good to see you, {displayName}.</h2><p>Manage what members see across Events, Competitions, News, payments and the WRJA community.</p></div>
        <div className="admin-welcome-mark">WRJA<span>ADMIN</span></div>
      </div>
      <div className="admin-stat-grid">{stats.map((stat) => <article className={`admin-stat-card admin-stat-${stat.tone}`} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}</div>
      <div className="admin-overview-grid">
        <section className="admin-command-card">
          <div className="admin-section-title"><div><p className="eyebrow">QUICK ACTIONS</p><h3>Keep the site current</h3></div></div>
          <div className="admin-quick-actions">
            {actions.map((action, index) => (
              <button key={action.tab} onClick={() => onNavigate(action.tab)}><span>{String(index + 1).padStart(2, "0")}</span><b>{action.title}</b><small>{action.detail}</small><i>→</i></button>
            ))}
          </div>
        </section>
        <section className="admin-health-card">
          <p className="eyebrow">SYSTEM HEALTH</p>
          <h3>{connectionStatus === "online" ? "Connected to the WRJA database." : connectionStatus === "offline" ? "Database connection unavailable." : "Checking the database connection…"}</h3>
          <div className={`admin-health-row admin-health-row-${connectionStatus}`}><span><i className="admin-health-dot" />Database</span><b>{databaseLabel}</b></div>
          <div className={`admin-health-row admin-health-row-${statusFor(unread > 0)}`}><span><i className="admin-health-dot" />Contact inbox</span><b>{connectionStatus === "offline" ? "Offline" : unread ? `${unread} unread` : connectionStatus === "online" ? "Clear" : "Checking…"}</b></div>
          <div className={`admin-health-row admin-health-row-${statusFor(pending > 0)}`}><span><i className="admin-health-dot" />POP submissions</span><b>{connectionStatus === "offline" ? "Offline" : pending ? `${pending} pending` : connectionStatus === "online" ? "Up to date" : "Checking…"}</b></div>
          <div className={`admin-health-row admin-health-row-${connectionStatus}`}><span><i className="admin-health-dot" />Uploaded files</span><b>{connectionStatus === "online" ? formatBytes(c.uploadsBytes || 0) : connectionStatus === "offline" ? "Offline" : "Checking…"}</b></div>
          <p className="admin-health-note">Everything is saved on the server, so changes are visible to every visitor straight away.</p>
        </section>
      </div>
    </div>
  );
}
