import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import programs from "../data/programs";
import instructors from "../data/instructors";
import trialbackground from "../assets/images/background/1125387-2500x1406-desktop-hd-combat-sports-background.jpg";
import { useAuth } from "../context/AuthContext";

const paymentMethods = ["EFT", "Cash at the dojo", "Card"];
const weeklyAvailability = ["16:00", "17:30", "19:00"];

export default function BookingPage() {
  const { user } = useAuth();
  const [selectedProgramSlug, setSelectedProgramSlug] = useState("");
  const [activeInstructorIndex, setActiveInstructorIndex] = useState(0);

  // Track the required booking fields so the card can glow
  // when the form is completely filled in.
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    paymentMethod: "",
    preferredDate: "",
    preferredTime: "",
  });

  if (!user) return <Navigate to="/login" replace />;

  const selectedProgram = programs.find(
    (program) => program.slug === selectedProgramSlug
  );

  const assignedInstructors = selectedProgram
    ? selectedProgram.instructorSlugs
        .map((slug) =>
          instructors.find((instructor) => instructor.slug === slug)
        )
        .filter(Boolean)
    : [];

  useEffect(() => {
    setActiveInstructorIndex(0);
  }, [selectedProgramSlug]);

  useEffect(() => {
    if (assignedInstructors.length < 2) return;

    const timer = setInterval(() => {
      setActiveInstructorIndex(
        (current) => (current + 1) % assignedInstructors.length
      );
    }, 4000);

    return () => clearInterval(timer);
  }, [assignedInstructors.length]);

  const activeInstructor = assignedInstructors[activeInstructorIndex];
  const availableTimes = formData.preferredDate ? weeklyAvailability : [];

  // Check all required fields.
  // Notes are intentionally excluded because they are optional.
  const isFormComplete =
    selectedProgramSlug &&
    formData.fullName.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    formData.paymentMethod &&
    formData.preferredDate &&
    formData.preferredTime;

  // Reusable handler for the required form fields.
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <div className="booking-page">
      <PageHeader title="Book a Session" />

      <section className="booking-section">
        <Reveal>
          <div
            className={`booking-card ${
              isFormComplete ? "booking-card-complete" : ""
            }`}
            style={{
              backgroundImage: `url("${trialbackground}")`,
            }}
          >
            <h2>Request a booking</h2>

            <p className="booking-card-subtitle">
              Choose a program and we'll confirm your session with the
              assigned instructor.
            </p>

            <form
              className="booking-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label>
                Program

                <select
                  value={selectedProgramSlug}
                  onChange={(event) => {
                    setSelectedProgramSlug(event.target.value);
                  }}
                  required
                >
                  <option value="" disabled>
                    Select a program
                  </option>

                  {programs.map((program) => (
                    <option key={program.slug} value={program.slug}>
                      {program.highlightWord} {program.restWord}
                    </option>
                  ))}
                </select>
              </label>

              {activeInstructor && (
                <Reveal
                  key={selectedProgramSlug}
                  className="booking-instructor-assigned"
                >
                  <img
                    key={activeInstructor.slug}
                    src={activeInstructor.image}
                    alt={activeInstructor.name}
                    className="booking-instructor-photo"
                  />

                  <div>
                    <p className="booking-instructor-label">
                      {assignedInstructors.length > 1
                        ? "Your instructor could be"
                        : "Your instructor"}
                    </p>

                    <p className="booking-instructor-name">
                      {activeInstructor.name}
                    </p>

                    <p className="booking-instructor-role">
                      {activeInstructor.role}
                    </p>
                  </div>

                  {assignedInstructors.length > 1 && (
                    <div className="booking-instructor-dots">
                      {assignedInstructors.map((instructor, index) => (
                        <button
                          key={instructor.slug}
                          type="button"
                          className={`booking-instructor-dot ${
                            index === activeInstructorIndex
                              ? "booking-instructor-dot-active"
                              : ""
                          }`}
                          onClick={() =>
                            setActiveInstructorIndex(index)
                          }
                          aria-label={`Show ${instructor.name}`}
                        />
                      ))}
                    </div>
                  )}
                </Reveal>
              )}

              {selectedProgramSlug && (
                <div className="booking-availability" role="status">
                  <strong>Availability</strong>
                  <span>{activeInstructor?.name || "Assigned instructor"} is available at the following times on your selected date:</span>
                  <div className="booking-availability-slots">{availableTimes.length ? availableTimes.map((time) => <span key={time} className="booking-slot">{time}</span>) : <span className="booking-availability-muted">Choose a date to see available time slots.</span>}</div>
                </div>
              )}

              <div className="booking-form-row-2">
                <label>
                  Full name

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label>
                  Email address

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    required
                  />
                </label>
              </div>

              <div className="booking-form-row-2">
                <label>
                  Phone number

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                    required
                  />
                </label>

                <label>
                  Payment method

                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>
                      Select a payment method
                    </option>

                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="booking-form-row-2">
                <label>
                  Preferred date

                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Preferred time

                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select an available time</option>
                    {availableTimes.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </label>
              </div>

              <label>
                Notes (optional)

                <textarea
                  rows="4"
                  placeholder="Anything we should know before your session"
                />
              </label>

              <button
                type="submit"
                className="btn btn-accent btn-lg"
              >
                Request booking
              </button>
            </form>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
