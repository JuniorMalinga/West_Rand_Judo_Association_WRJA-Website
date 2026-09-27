import { useMemo } from "react";
import { getCompetitions, getCompetitionStatus } from "../data/competitions";
import seedEvents from "../data/events";
import { useAuth } from "../context/AuthContext";

const EVENTS_KEY = "wrja.events";
const MESSAGES_KEY = "wrja.contact.messages";

function readArray(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export default function AdminOverviewPanel({ onNavigate }) {
  const { users, displayName } = useAuth();
  const competitions = getCompetitions();
  const events = readArray(EVENTS_KEY, seedEvents);
  const messages = readArray(MESSAGES_KEY, []);
  const pop = readArray("wrja.pop", null);
  const openCompetitions = competitions.filter((item) => ["Registration Open", "Registration Closing Soon"].includes(getCompetitionStatus(item))).length;
  const upcomingEvents = events.filter((item) => item.date && new Date(`${item.date}T12:00:00`) >= new Date()).length;
  const stats = useMemo(() => [
    { label: "Live competitions", value: openCompetitions, tone: "gold", detail: `${competitions.length} total managed` },
    { label: "Upcoming events", value: upcomingEvents, tone: "dark", detail: `${events.length} event records` },
    { label: "Member accounts", value: users.length, tone: "light", detail: `${users.filter((user) => user.role !== "admin").length} members` },
    { label: "Messages", value: messages.length, tone: "light", detail: messages.length ? "Needs attention" : "Inbox clear" },
  ], [competitions.length, events.length, messages.length, openCompetitions, upcomingEvents, users]);

  return (
    <div className="admin-overview">
      <div className="admin-welcome-card">
        <div><p className="eyebrow">CONTROL CENTRE</p><h2>Good to see you, {displayName}.</h2><p>Manage what members see across Events, Competitions, payments and the WRJA community.</p></div>
        <div className="admin-welcome-mark">WRJA<span>ADMIN</span></div>
      </div>
      <div className="admin-stat-grid">{stats.map((stat) => <article className={`admin-stat-card admin-stat-${stat.tone}`} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}</div>
      <div className="admin-overview-grid">
        <section className="admin-command-card"><div className="admin-section-title"><div><p className="eyebrow">QUICK ACTIONS</p><h3>Keep the site current</h3></div></div><div className="admin-quick-actions"><button onClick={() => onNavigate("competitions")}><span>01</span><b>Manage competitions</b><small>Registration and payment links</small><i>→</i></button><button onClick={() => onNavigate("events")}><span>02</span><b>Publish an event</b><small>Dates, venues and applications</small><i>→</i></button><button onClick={() => onNavigate("messages")}><span>03</span><b>Review messages</b><small>Respond to club enquiries</small><i>→</i></button><button onClick={() => onNavigate("users")}><span>04</span><b>Manage members</b><small>Accounts and access roles</small><i>→</i></button></div></section>
        <section className="admin-health-card"><p className="eyebrow">SYSTEM HEALTH</p><h3>Everything is local and ready.</h3><div className="admin-health-row"><span><i className="admin-health-dot" />Authentication</span><b>Connected</b></div><div className="admin-health-row"><span><i className="admin-health-dot" />Competition links</span><b>Editable</b></div><div className="admin-health-row"><span><i className="admin-health-dot" />POP submissions</span><b>{pop ? "1 recent" : "Awaiting uploads"}</b></div><p className="admin-health-note">Changes are saved in this browser and reflected in the public preview immediately.</p></section>
      </div>
    </div>
  );
}
