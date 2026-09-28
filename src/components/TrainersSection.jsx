import Reveal from "./Reveal";
import instructors from "../data/instructors";

export default function TrainersSection() {
  return (
    <section className="trainers">
      <Reveal className="trainers-header">
        <h2>Our instructors</h2>
        <p>Experienced, qualified coaches guiding every belt level</p>
      </Reveal>

      <div className="trainers-grid">
        {instructors.map((instructor, index) => (
          <Reveal key={instructor.slug} delay={index * 120}>
            <div
              className="trainer-card"
              style={{ backgroundImage: `url(${instructor.image})`, backgroundPosition: instructor.imagePosition || "center" }}
            >
              <div className="trainer-info">
                <h3>{instructor.name}</h3>
                <p className="trainer-role">{instructor.role}</p>
                <p className="trainer-bio">{instructor.excerpt}</p>
                <div className="trainer-socials">
                  {instructor.social.map((link) => (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                      {link.label.slice(0, 2).toUpperCase()}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}