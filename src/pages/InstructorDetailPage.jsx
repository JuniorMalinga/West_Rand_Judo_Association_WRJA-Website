import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { getInstructorBySlug } from "../services/instructorsService";

const tabs = ["Biography", "Skills", "Message"];

export default function InstructorDetailPage() {
  const { slug } = useParams();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Biography");

  useEffect(() => {
    let isMounted = true;

    async function loadInstructor() {
      try {
        setLoading(true);
        setError("");
        const data = await getInstructorBySlug(slug);
        if (isMounted) {
          setInstructor(data);
        }
      } catch (err) {
        console.error("Failed to load instructor by slug:", err);
        if (isMounted) {
          setError(err.message || "Failed to load instructor.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInstructor();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="simple-page">
        <h1>Loading instructor...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-page">
        <h1>Error loading instructor</h1>
        <p className="auth-error">{error}</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="simple-page">
        <h1>Instructor not found</h1>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="instructor-detail-page">
      <PageHeader title={instructor.name} crumbs={[{ label: "Instructors" }]} />

      <section className="instructor-detail-layout">
        <Reveal className="instructor-detail-card">
          <img src={instructor.image} alt={instructor.name} />
          <h3>{instructor.name}</h3>
          <p className="instructor-detail-role">{instructor.role}</p>
          {instructor.social && instructor.social.length > 0 && (
            <div className="instructor-detail-socials">
              {instructor.social.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                >
                  {link.label.slice(0, 2).toUpperCase()}
                </a>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={150} className="instructor-detail-panel">
          <div className="instructor-detail-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "instructor-tab-active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="instructor-detail-content">
            {activeTab === "Biography" && (
              <div>
                {instructor.bio && instructor.bio.length > 0 ? (
                  instructor.bio.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <p>No biography available.</p>
                )}
              </div>
            )}

            {activeTab === "Skills" && (
              <div className="instructor-skills">
                {instructor.qualifications && (
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ marginBottom: "6px", fontSize: "16px", textTransform: "uppercase" }}>
                      Qualifications
                    </h4>
                    <p>{instructor.qualifications}</p>
                  </div>
                )}
                {instructor.specialisations && (
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ marginBottom: "6px", fontSize: "16px", textTransform: "uppercase" }}>
                      Specialisations
                    </h4>
                    <p>{instructor.specialisations}</p>
                  </div>
                )}
                {!instructor.qualifications && !instructor.specialisations && (
                  <p>No qualifications or specialisations listed.</p>
                )}
              </div>
            )}

            {activeTab === "Message" && (
              /* Non-functional for now — no submit handling wired up yet. */
              <form
                className="instructor-message-form"
                onSubmit={(event) => event.preventDefault()}
              >
                <input type="text" placeholder="Name" required />
                <input type="email" placeholder="Email Address" required />
                <textarea rows="5" placeholder="Message" required />
                <button type="submit" className="btn btn-accent">
                  Send message
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}