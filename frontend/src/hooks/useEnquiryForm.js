import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { submitMessage } from "../data/messages";

// Shared behaviour for every "contact the club" form: prefills from the
// logged-in member, sends to the server (which validates again) and reports status.
export default function useEnquiryForm({ source, initialMessage = "" }) {
  const { profile } = useAuth() || {};
  const [values, setValues] = useState(() => ({
    name: [profile?.firstName, profile?.lastName].filter(Boolean).join(" "),
    email: profile?.email || "",
    phone: profile?.phone || "",
    message: initialMessage,
    website: "", // honeypot
  }));
  const [status, setStatus] = useState(null); // { type: "success" | "error", text }
  const [sending, setSending] = useState(false);

  const setField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (status) setStatus(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      await submitMessage({ ...values, source });
      setValues((current) => ({ ...current, message: "" }));
      setStatus({ type: "success", text: `Thank you, your message has been sent. A confirmation email is on its way to ${values.email.trim()}, and WRJA will reply there.` });
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setSending(false);
    }
  };

  return { values, setField, submit, status, sending };
}
