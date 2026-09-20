import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import AboutSection from "../components/AboutSection";
import ProgramsSection from "../components/ProgramsSection";
import FeaturesSection from "../components/FeaturesSection";
import TrainersSection from "../components/TrainersSection";
import NewsSection from "../components/NewsSection";
import Reveal from "../components/Reveal";
import InstructorRow from "../components/InstructorRow";
import ClubLinks from "../components/ClubLinks";
import { getInstructors } from "../services/instructorsService";

const missionPoints = [
  "Promote and develop the sport of judo throughout the West Rand.",
  "Provide safe, professional, and inclusive training environments.",
  "Support the growth and development of athletes, coaches, referees, and officials.",
  "Encourage the values of respect, discipline, integrity, perseverance, and self-improvement.",
  "Create opportunities for participation at recreational, developmental, provincial, national, and international levels.",
  "Build a strong judo community that positively impacts individuals, families, and society.",
];

export default function AboutPage() {
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
    <div className="about-page">
      <PageHeader title="About" />

      {/* Same section blocks as the Home page, in the same order as the
          reference layout, just with WRJA's real content instead of
          the boxing-demo placeholders. */}
      <AboutSection />
      <ProgramsSection />
      <FeaturesSection />
      <TrainersSection />
      <NewsSection />

      {/* Deeper real content that didn't fit the reference sections above —
          full mission list, full instructor bios, and affiliated club
          links, sourced from WRJA_WEB_DETAILS.docx. */}
      <section className="about-mission">
        <Reveal className="about-mission-header">
          <h2>Our mission</h2>
          <p>
            Our mission is to develop confident, disciplined, and respectful
            individuals through the practice of judo. We are committed to providing
            high-quality coaching, fostering sportsmanship, promoting inclusivity,
            and creating opportunities for athletes to reach their full potential
            both on and off the mat.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <ul className="program-row-list about-mission-list">
            {missionPoints.map((point, index) => (
              <li key={index} style={{ transitionDelay: `${index * 80}ms` }}>{point}</li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="instructors-page-section">
        <Reveal className="instructors-header">
          <h2>Our instructors &amp; facilitators</h2>
          <p>
            The West Rand Judo Association is proud to be supported by highly
            qualified and experienced instructors who are passionate about
            developing athletes and building a strong judo community.
          </p>
        </Reveal>

        {loading && <p className="simple-page">Loading instructors...</p>}
        {error && <p className="simple-page">{error}</p>}
        {!loading && !error && instructors.length === 0 && (
          <p className="simple-page">No instructors are available right now.</p>
        )}

        {instructors.map((instructor, index) => (
          <InstructorRow key={instructor.id} instructor={instructor} reverse={index % 2 === 1} />
        ))}
      </section>

      <ClubLinks />
    </div>
  );
}
