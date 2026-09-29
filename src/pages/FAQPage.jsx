import PageHeader from "../components/PageHeader";
import { Link } from "react-router-dom";
import FAQAccordion from "../components/FAQAccordion";

export default function FAQPage() {
  return (
    <div className="faq-page">
      <PageHeader title="FAQ" />
      <section className="faq-section">
        <FAQAccordion />

        <div className="faq-contact-cta">
          <h3>Still have a question?</h3>
          <p>Send WRJA a message and we'll get back to you.</p>
          <Link to="/contact" className="btn btn-accent">Contact us</Link>
        </div>
      </section>
    </div>
  );
}