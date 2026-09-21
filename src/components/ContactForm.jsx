import { useState, useEffect } from "react";
import Reveal from "./Reveal";
import { useAuth } from "../context/AuthContext";
import { createContactMessage } from "../services/contactMessagesService";

export default function ContactForm() {
  const { user, profile } = useAuth() || {};

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  // Pre-fill fields if user is authenticated
  useEffect(() => {
    if (user || profile) {
      setFormData((current) => ({
        ...current,
        fullName:
          current.fullName ||
          (profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile?.displayName || ""),
        email: current.email || user?.email || "",
        phone: current.phone || profile?.phone || "",
      }));
    }
  }, [user, profile]);

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

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmissionError("Please fill in all required fields (Name, Email, Message).");
      return;
    }

    setIsSubmitting(true);

    try {
      const requesterProfileId = profile?.id || user?.id || null;

      await createContactMessage({
        requesterProfileId,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
      });

      setSubmissionSuccess(
        "Thank you for reaching out! Your message has been sent successfully."
      );

      // Clear the form only after successful insert
      setFormData({
        fullName:
          profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile?.displayName || "",
        phone: profile?.phone || "",
        email: user?.email || "",
        message: "",
      });
    } catch (err) {
      console.error("Failed to send contact message:", err);
      setSubmissionError(
        err.message || "Failed to send message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Reveal className="contact-form-wrap">
      <h2>Contact form</h2>

      {submissionSuccess && (
        <p
          className="auth-success"
          style={{
            marginBottom: "18px",
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
            marginBottom: "18px",
            padding: "14px",
            background: "rgba(220, 53, 69, 0.2)",
            border: "1px solid rgba(220, 53, 69, 0.4)",
            borderRadius: "var(--radius)",
          }}
        >
          {submissionError}
        </p>
      )}

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="contact-form-row">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Your Phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleInputChange}
          required
        />

        <textarea
          rows="6"
          name="message"
          placeholder="Your message"
          value={formData.message}
          onChange={handleInputChange}
          required
        />

        <button
          type="submit"
          className="btn btn-accent btn-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending message..." : "Send message"}
        </button>
      </form>
    </Reveal>
  );
}