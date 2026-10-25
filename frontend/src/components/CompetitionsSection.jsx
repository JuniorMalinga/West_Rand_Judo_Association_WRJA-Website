import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import CompetitionCard from "./CompetitionCard";
import { competitionsStore } from "../data/competitions";
import useCollection from "../hooks/useCollection";
import { useAuth } from "../context/AuthContext";

export default function CompetitionsSection() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const competitions = [...useCollection(competitionsStore)].sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 3);

  return (
    <section className="competitions-home-section">
      <div className="section-heading">
        <p className="eyebrow">WHAT'S NEXT</p>
        <h2>Step onto the <span className="text-accent">competition mat.</span></h2>
        <p>
          {isLoggedIn
            ? "View competition details, registration links and WRJA payment requirements."
            : "Log in to view competition details, registration links and WRJA payment requirements."}
        </p>
      </div>
      <div className="competitions-home-grid">
        {competitions.map((competition, index) => (
          <Reveal key={competition.id} delay={index * 100}>
            <CompetitionCard competition={competition} locked={!isLoggedIn} />
          </Reveal>
        ))}
      </div>
      <Link
        className="btn btn-accent competitions-home-cta"
        to={isLoggedIn ? "/events/competitions" : "/login"}
      >
        {isLoggedIn ? "View all competitions" : "Login to view competitions"}
      </Link>
    </section>
  );
}
