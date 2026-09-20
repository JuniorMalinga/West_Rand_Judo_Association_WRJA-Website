import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { getProgramBySlug } from "../services/programsService";
import Reveal from "../components/Reveal";
import TrainersSection from "../components/TrainersSection";

export default function ProgramDetailPage() {
  const { slug } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setProgram(null);

    async function loadProgram() {
      try {
        const result = await getProgramBySlug(slug);
        if (!cancelled) setProgram(result);
      } catch {
        if (!cancelled) setError("The program could not be loaded right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProgram();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <div className="simple-page">Loading program...</div>;
  if (error) return <div className="simple-page">{error}</div>;

  if (!program) {
    return (
      <div className="simple-page">
        <h1>Program not found</h1>
        <Link to="/programs">Back to programs</Link>
      </div>
    );
  }

  const title = `${program.highlightWord} ${program.restWord}`;

  return (
    <div className="program-detail-page">
      <PageHeader title={title} crumbs={[{ label: "Our programs", to: "/programs" }]} />

      <section className="program-detail">
        <Reveal className="program-detail-image-wrap">
          <img src={program.image} alt={title} />
        </Reveal>

        <Reveal delay={150} className="program-detail-content">
          <h2>
            <span className="text-accent">{program.highlightWord}</span>{" "}
            <span className="program-row-second-word">{program.restWord}</span>
          </h2>
          <p>{program.description}</p>
          <ul className="program-row-list">
            {program.bullets.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
          <Link to="/programs" className="btn btn-outline-dark">&larr; Back to all programs</Link>
        </Reveal>
      </section>

      <TrainersSection />
    </div>
  );
}
import { useEffect, useState } from "react";
