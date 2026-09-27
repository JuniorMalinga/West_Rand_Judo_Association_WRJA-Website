import { Link, Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { useAuth } from "../context/AuthContext";
import { getCompetitions } from "../data/competitions";

export default function DashboardPage() {
  const { user, displayName } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const competitions = getCompetitions().filter((item) => item.registrationUrl || item.paymentRequired).slice(0, 3);
  return <div className="dashboard-page"><PageHeader title={`Welcome, ${displayName}`} /><section className="dashboard-grid"><Reveal className="dashboard-card dashboard-card-feature"><p className="eyebrow">MEMBER HOME</p><h2>Your next step on the mat</h2><p>Explore current competitions, complete registrations, and upload proof of payment when WRJA payment is required.</p><Link to="/competitions" className="btn btn-accent">Explore competitions</Link></Reveal><Reveal delay={80} className="dashboard-card"><h3>Quick actions</h3><Link className="dashboard-action" to="/competitions">View competitions <span>→</span></Link><Link className="dashboard-action" to="/proof-of-payment">Upload proof of payment <span>→</span></Link><Link className="dashboard-action" to="/booking">Book a training session <span>→</span></Link></Reveal></section><section className="dashboard-events"><div className="section-heading"><p className="eyebrow">YOUR SHORTLIST</p><h2>Registration actions</h2></div><div className="dashboard-event-list">{competitions.length ? competitions.map((competition) => <div className="dashboard-event-row" key={competition.id}><div><strong>{competition.name}</strong><p>{competition.paymentRequired ? "Registration + WRJA payment" : "Registration"}</p></div><Link to={`/competitions/${competition.slug}`} className="btn btn-outline-dark">View</Link></div>) : <p>No competition actions are currently published.</p>}</div></section></div>;
}
