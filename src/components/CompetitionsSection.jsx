import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import CompetitionCard from "./CompetitionCard";
import { getCompetitions } from "../data/competitions";

export default function CompetitionsSection() {
  const competitions = getCompetitions().slice(0, 3);
  return <section className="competitions-home-section"><div className="section-heading"><p className="eyebrow">WHAT'S NEXT</p><h2>Step onto the <span className="text-accent">competition mat.</span></h2><p>Explore registrations, upcoming events and WRJA payment requirements in one place.</p></div><div className="competitions-home-grid">{competitions.map((competition, index) => <Reveal key={competition.id} delay={index * 100}><CompetitionCard competition={competition} /></Reveal>)}</div><Link className="btn btn-outline-dark competitions-home-cta" to="/competitions">View all competitions</Link></section>;
}
