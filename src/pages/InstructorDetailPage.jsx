import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import instructors from "../data/instructors";
import FormStatus from "../components/FormStatus";
import HoneypotField from "../components/HoneypotField";
import useEnquiryForm from "../hooks/useEnquiryForm";

const tabs = ["Biography", "Skills", "Message"];

export default function InstructorDetailPage() {
  const { slug } = useParams();
  const instructor = instructors.find((item) => item.slug === slug);
  const [activeTab, setActiveTab] = useState("Biography");
  const messageForm = useEnquiryForm({ source: `Message for ${instructor?.name || slug}` });

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
      <PageHeader
        title={instructor.name}
        crumbs={[{ label: "Instructors" }]}
      />

      <section className="instructor-detail-layout">
        <Reveal className="instructor-detail-card">
          <img
            src={instructor.image}
            alt={instructor.name}
            // FIX: Allows individual instructor images to control their crop.
            // Neil's data uses "center top" so his head is not cut off.
            style={{
              objectPosition: instructor.imagePosition || "center",
            }}
          />

          <h3>{instructor.name}</h3>

          <p className="instructor-detail-role">
            {instructor.role}
          </p>

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
        </Reveal>

        <Reveal
          delay={150}
          className="instructor-detail-panel"
        >
          <div className="instructor-detail-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={
                  activeTab === tab
                    ? "instructor-tab-active"
                    : ""
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="instructor-detail-content">
            {activeTab === "Biography" && (
              <div>
                {instructor.bio.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}

            {activeTab === "Skills" && (
              <div className="instructor-skills">
                {instructor.skills.map((skill) => (
                  <div
                    key={skill.label}
                    className="instructor-skill-row"
                  >
                    <div className="instructor-skill-label">
                      <span>{skill.label}</span>
                      <span>{skill.percentage}%</span>
                    </div>

                    <div className="instructor-skill-bar-track">
                      <div
                        className="instructor-skill-bar-fill"
                        style={{
                          width: `${skill.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Message" && (
              <form
                className="instructor-message-form"
                onSubmit={messageForm.submit}
              >
                <HoneypotField value={messageForm.values.website} onChange={messageForm.setField("website")} />
                <input
                  type="text"
                  placeholder="Name"
                  value={messageForm.values.name}
                  onChange={messageForm.setField("name")}
                  required
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  value={messageForm.values.email}
                  onChange={messageForm.setField("email")}
                  required
                />

                <textarea
                  rows="5"
                  placeholder="Message"
                  value={messageForm.values.message}
                  onChange={messageForm.setField("message")}
                  required
                />

                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={messageForm.sending}
                >
                  {messageForm.sending ? "Sending…" : "Send message"}
                </button>

                <FormStatus status={messageForm.status} />
              </form>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}