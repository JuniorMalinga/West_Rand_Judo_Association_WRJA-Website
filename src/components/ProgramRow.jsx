import { Link } from "react-router-dom";
import Reveal from "./Reveal";

// Renders one program row. reverse flips the image to the right side so
// rows alternate left/right down the page, matching the reference layout.
export default function ProgramRow({ program, reverse }) {
  return (
    <Reveal className={`program-row ${reverse ? "program-row-reverse" : ""}`}>
      <Link to={`/programs/${program.slug}`} className="program-row-image-link">
        <img src={program.image} alt={`${program.highlightWord} ${program.restWord}`} loading="lazy" decoding="async" />
      </Link>

      <div className="program-row-content">
        <Link to={`/programs/${program.slug}`} className="program-row-heading">
          <h2>
            <span className="text-accent">{program.highlightWord}</span>{" "}
            <span className="program-row-second-word">{program.restWord}</span>
          </h2>
        </Link>

        <p>{program.description}</p>

        <ul className="program-row-list">
          {program.bullets.map((bullet, index) => (
            <li key={index} style={{ transitionDelay: `${index * 100}ms` }}>
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}