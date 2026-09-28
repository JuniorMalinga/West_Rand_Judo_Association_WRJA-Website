import Reveal from "./Reveal";

// Renders one instructor's bio in an alternating image/text row, the same
// visual language as ProgramRow so the site stays consistent.
export default function InstructorRow({ instructor, reverse }) {
  return (
    <Reveal className={`instructor-row ${reverse ? "program-row-reverse" : ""}`}>
      <img src={instructor.image} alt={instructor.name} className="instructor-image" style={{ objectPosition: instructor.imagePosition || "center" }} />

      <div className="instructor-content">
        <h2>{instructor.name}</h2>
        <p className="instructor-role">{instructor.role}</p>

        {instructor.bio.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}

        {instructor.quote && (
          <blockquote className="instructor-quote">&ldquo;{instructor.quote}&rdquo;</blockquote>
        )}
      </div>
    </Reveal>
  );
}