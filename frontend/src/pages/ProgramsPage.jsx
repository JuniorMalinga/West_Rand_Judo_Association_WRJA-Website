import PageHeader from "../components/PageHeader";
import ProgramRow from "../components/ProgramRow";
import programs from "../data/programs";

export default function ProgramsPage() {
  return (
    <div className="programs-page">
      <PageHeader title="Programs" />

      <section className="programs-list">
        {programs.map((program, index) => (
          <ProgramRow key={program.slug} program={program} reverse={index % 2 === 1} />
        ))}
      </section>
    </div>
  );
}