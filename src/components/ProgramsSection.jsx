import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import programs from "../data/programs";

export default function ProgramsSection() {
  return (
    <section className="programs">
      <div className="programs-grid">
        {programs.map((program, index) => (
          <Reveal key={program.slug} delay={index * 120}>
            <Link
              to={`/programs/${program.slug}`}
              className="program-card"
            >
              <img className="program-card-image" src={program.image} alt="" loading="lazy" decoding="async" />
              <div className="program-card-overlay">
                <h3>{program.highlightWord} {program.restWord}</h3>
                <p>{program.description}</p>
                <span className="program-arrow">&rarr;</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
