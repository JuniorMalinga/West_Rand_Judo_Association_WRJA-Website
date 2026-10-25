import Reveal from "./Reveal";
import { clubLocations } from "../data/clubContacts";
import { toTelHref } from "../lib/format";

export default function ContactInfo() {
  return (
    <Reveal delay={150} className="contact-info">
      <h2>Contact info</h2>

      {clubLocations.map((location, index) => (
        <Reveal key={location.name} delay={200 + index * 120} className="contact-location">
          <h3>{location.name}</h3>
          <p className="contact-location-address">
            &#128205;{" "}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`} target="_blank" rel="noopener noreferrer">
              {location.address}
            </a>
          </p>
          <p className="contact-location-note">{location.note}</p>

          {location.contacts.map((contact) => (
            <div key={contact.label} className="contact-location-detail">
              <span className="contact-location-detail-label">{contact.label}</span>
              <a href={toTelHref(contact.phone)}>&#128222; {contact.phone}</a>
              <a href={`mailto:${contact.email}`}>&#9993; {contact.email}</a>
            </div>
          ))}
        </Reveal>
      ))}
    </Reveal>
  );
}
