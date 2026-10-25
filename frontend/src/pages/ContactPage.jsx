import PageHeader from "../components/PageHeader";
import ContactForm from "../components/ContactForm";
import ContactInfo from "../components/ContactInfo";
import ContactMap from "../components/ContactMap";

export default function ContactPage() {
  return (
    <div className="contact-page">
      <PageHeader title="Contacts" />

      <section className="contact-layout">
        <ContactForm />
        <ContactInfo />
      </section>

      <ContactMap />
    </div>
  );
}