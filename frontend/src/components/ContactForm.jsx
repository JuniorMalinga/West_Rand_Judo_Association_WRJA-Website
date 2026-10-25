import { useSearchParams } from "react-router-dom";
import Reveal from "./Reveal";
import FormStatus from "./FormStatus";
import HoneypotField from "./HoneypotField";
import useEnquiryForm from "../hooks/useEnquiryForm";

export default function ContactForm() {
  // Other pages link here with ?topic=... (store orders, competition questions)
  const [params] = useSearchParams();
  const topic = params.get("topic");

  const { values, setField, submit, status, sending } = useEnquiryForm({
    source: topic ? `Contact page: ${topic}` : "Contact page",
    initialMessage: topic ? `I'd like to enquire about: ${topic}.\n\n` : "",
  });

  return (
    <Reveal className="contact-form-wrap">
      <h2>Contact form</h2>

      <form className="contact-form" onSubmit={submit}>
        <HoneypotField value={values.website} onChange={setField("website")} />
        <div className="contact-form-row">
          <input type="text" placeholder="Full Name" value={values.name} onChange={setField("name")} required />
          <input type="tel" placeholder="Your Phone" value={values.phone} onChange={setField("phone")} />
        </div>

        <input type="email" placeholder="Email Address" value={values.email} onChange={setField("email")} required />

        <textarea rows="6" placeholder="Your message" value={values.message} onChange={setField("message")} required />

        <button type="submit" className="btn btn-accent btn-lg" disabled={sending}>{sending ? "Sending…" : "Send message"}</button>
        <FormStatus status={status} />
      </form>
    </Reveal>
  );
}
