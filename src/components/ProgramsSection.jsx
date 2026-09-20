import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { getPrograms } from "../services/programsService";

export default function ProgramsSection() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPrograms() {
      try {
        const result = await getPrograms();

        if (!cancelled) {
          setPrograms(result);
        }
      } catch (loadError) {
        console.error("Could not load WRJA programs:", loadError);

        if (!cancelled) {
          setError("Programs could not be loaded right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPrograms();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="programs">
      {loading && (
        <p className="simple-page">Loading programs...</p>
      )}

      {error && (
        <p className="simple-page">{error}</p>
      )}

      {!loading && !error && programs.length === 0 && (
        <p className="simple-page">
          No programs are available right now.
        </p>
      )}

      {!loading && !error && programs.length > 0 && (
        <div className="programs-grid">
          {programs.map((program, index) => (
            <Reveal key={program.id} delay={index * 120}>
              <Link
                to={`/programs/${program.slug}`}
                className="program-card"
                style={{
                  backgroundImage: `url(${program.image})`,
                }}
              >
                <div className="program-card-overlay">
                  <h3>{program.name}</h3>

                  <p>
                    {program.shortDescription ||
                      program.description}
                  </p>

                  <span className="program-arrow">
                    &rarr;
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}