import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import CompetitionCard from "../components/CompetitionCard";
import { getCompetitions } from "../data/competitions";

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState(() => getCompetitions().sort((a, b) => a.displayOrder - b.displayOrder));
  useEffect(() => {
    const refresh = () => setCompetitions(getCompetitions().sort((a, b) => a.displayOrder - b.displayOrder));
    window.addEventListener("wrja:competitions-updated", refresh);
    return () => window.removeEventListener("wrja:competitions-updated", refresh);
  }, []);
  return (
    <div className="competitions-page">
      <PageHeader title="Competitions" />
      <section className="competitions-intro">
        <Reveal><p className="eyebrow">ON THE MAT &amp; BEYOND</p><h1>Competitions, events <span className="text-accent">and registrations.</span></h1><p>Find upcoming opportunities for WRJA athletes, understand what each entry requires, and register through the organiser or WRJA when links are published.</p></Reveal>
      </section>
      <section className="competitions-grid" aria-label="Competitions and events">
        {competitions.map((competition, index) => <Reveal key={competition.id} delay={index * 55}><CompetitionCard competition={competition} /></Reveal>)}
      </section>
    </div>
  );
}
