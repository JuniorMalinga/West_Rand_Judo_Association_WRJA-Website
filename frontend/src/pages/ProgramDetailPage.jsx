import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import programs from "../data/programs";
import Reveal from "../components/Reveal";
import TrainersSection from "../components/TrainersSection";

export default function ProgramDetailPage() {
  const { slug } = useParams();
  const program = programs.find((item) => item.slug === slug);

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