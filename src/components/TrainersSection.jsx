import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { getInstructors } from "../services/instructorsService";

export default function TrainersSection() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInstructors() {
      try {
        const result = await getInstructors();
        if (!cancelled) setInstructors(result);
      } catch {
        if (!cancelled) setError("Instructors could not be loaded right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInstructors();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="trainers">
      <Reveal className="trainers-header">
        <h2>Our instructors</h2>
        <p>Experienced, qualified coaches guiding every belt level</p>
      </Reveal>

      {loading && <p className="simple-page">Loading instructors...</p>}
      {error && <p className="simple-page">{error}</p>}
      {!loading && !error && instructors.length === 0 && (
        <p className="simple-page">No instructors are available right now.</p>
      )}

      <div className="trainers-grid">
        {instructors.map((instructor, index) => (
          <Reveal key={instructor.id} delay={index * 120}>
            <div
              className="trainer-card"
              style={{ backgroundImage: `url(${instructor.image})` }}
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
