import PageHeader from "../components/PageHeader";
import ProgramRow from "../components/ProgramRow";
import { getPrograms } from "../services/programsService";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPrograms() {
      try {
        const result = await getPrograms();
        if (!cancelled) setPrograms(result);
      } catch {
        if (!cancelled) setError("Programs could not be loaded right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPrograms();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="programs-page">
      <PageHeader title="Programs" />

      <section className="programs-list">
        {loading && <p className="simple-page">Loading programs...</p>}
        {error && <p className="simple-page">{error}</p>}
        {!loading && !error && programs.length === 0 && (
          <p className="simple-page">No programs are available right now.</p>
        )}
        {programs.map((program, index) => (
          <ProgramRow key={program.slug} program={program} reverse={index % 2 === 1} />
        ))}
      </section>
    </div>
  );
}
import { useEffect, useState } from "react";
