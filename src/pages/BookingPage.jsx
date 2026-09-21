import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { getPrograms } from "../services/programsService";
import { createTrialRequest } from "../services/trialRequestsService";
import trialbackground from "../assets/images/background/1125387-2500x1406-desktop-hd-combat-sports-background.jpg";
import { useAuth } from "../context/AuthContext";

const paymentMethods = ["EFT", "Cash at the dojo", "Card"];

export default function BookingPage() {
  const { user, profile } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [activeInstructorIndex, setActiveInstructorIndex] = useState(0);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    paymentMethod: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  // Require authentication to access the booking request page
  if (!user) return <Navigate to="/login" replace />;

  // Pre-fill user contact information from auth profile
  useEffect(() => {
    if (profile || user) {
      setFormData((current) => ({
        ...current,
        fullName:
          current.fullName ||
          (profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : ""),
        email: current.email || user?.email || "",
        phone: current.phone || profile?.phone || "",
      }));
    }
  }, [profile, user]);

  // Load programs from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    async function loadPrograms() {
      try {
        setLoadingPrograms(true);
        const data = await getPrograms();
        if (isMounted) setPrograms(data);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        if (isMounted) setLoadingPrograms(false);
      }
    }

    loadPrograms();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProgram = programs.find(
    (program) => program.id === selectedProgramId
  );

  const assignedInstructors = selectedProgram?.instructors || [];

  useEffect(() => {
    setActiveInstructorIndex(0);
  }, [selectedProgramId]);

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

  // Check all required fields so the booking card glows gold when complete
  const isFormComplete =
    selectedProgramId &&
    formData.fullName.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    formData.paymentMethod &&
    formData.preferredDate &&
    formData.preferredTime;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmissionSuccess("");
    setSubmissionError("");

    if (!isFormComplete) {
      setSubmissionError("Please fill in all required booking fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createTrialRequest({
        programId: selectedProgramId,
        requesterProfileId: profile?.id || user?.id || null,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        paymentMethod: formData.paymentMethod,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        notes: formData.notes.trim() || null,
      });

      setSubmissionSuccess(
        "Booking request submitted successfully! We'll confirm your session with the assigned instructor shortly."
      );

      // Clear the form only after successful Supabase insert
      setSelectedProgramId("");
      setFormData({
        fullName:
          profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : "",
        email: user?.email || "",
        phone: profile?.phone || "",
        paymentMethod: "",
        preferredDate: "",
        preferredTime: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to submit trial request:", err);
      setSubmissionError(
        err.message || "Failed to submit booking request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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

            {submissionSuccess && (
              <p
                className="auth-success"
                style={{
                  marginBottom: "24px",
                  padding: "14px",
                  background: "rgba(40, 167, 69, 0.2)",
                  border: "1px solid rgba(40, 167, 69, 0.4)",
                  borderRadius: "var(--radius)",
                }}
              >
                {submissionSuccess}
              </p>
            )}

            {submissionError && (
              <p
                className="auth-error"
                style={{
                  marginBottom: "24px",
                  padding: "14px",
                  background: "rgba(220, 53, 69, 0.2)",
                  border: "1px solid rgba(220, 53, 69, 0.4)",
                  borderRadius: "var(--radius)",
                }}
              >
                {submissionError}
              </p>
            )}

            <form className="booking-form" onSubmit={handleSubmit}>
              <label>
                Program
                <select
                  value={selectedProgramId}
                  onChange={(event) => {
                    setSelectedProgramId(event.target.value);
                  }}
                  required
                >
                  <option value="" disabled>
                    {loadingPrograms
                      ? "Loading programs..."
                      : "Select a program"}
                  </option>

                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.highlightWord} {program.restWord}
                    </option>
                  ))}
                </select>
              </label>

              {activeInstructor && (
                <Reveal
                  key={selectedProgramId}
                  className="booking-instructor-assigned"
                >
                  <img
                    key={activeInstructor.slug || activeInstructor.id}
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
                          key={instructor.slug || instructor.id || index}
                          type="button"
                          className={`booking-instructor-dot ${
                            index === activeInstructorIndex
                              ? "booking-instructor-dot-active"
                              : ""
                          }`}
                          onClick={() => setActiveInstructorIndex(index)}
                          aria-label={`Show ${instructor.name}`}
                        />
                      ))}
                    </div>
                  )}
                </Reveal>
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
                  <input
                    type="time"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              <label>
                Notes (optional)
                <textarea
                  rows="4"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Anything we should know before your session"
                />
              </label>

              <button
                type="submit"
                className="btn btn-accent btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting request..." : "Request booking"}
              </button>
            </form>
          </div>
        </Reveal>
      </section>
    </div>
  );
}