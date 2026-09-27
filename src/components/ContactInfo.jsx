import Reveal from "./Reveal";

// Real location and contact details from WRJA_WEB_DETAILS.docx.
const locations = [
  {
    name: "Golden Score Judo Dojo",
    address: "26 Covent Road, Greenhills, Randfontein",
    note: "School classes and additional outside venues available",
    contacts: [
      { label: "Office", phone: "078 870 9131", email: "simone@goldenscore.co.za" },
      { label: "Sensei Michelle", phone: "083 312 4312", email: "judoinfo@goldenscore.co.za" },
    ],
  },
  {
    name: "KJK Judo",
    address: "NGK Paardekraal, Krugersdorp",
    note: "Additional training venues and school classes available",
    contacts: [
      { label: "Contact", phone: "083 329 5923", email: "katjajudo@iburst.co.za" },
    ],
  },
  {
    name: "West Rand Judo Association",
    address: "3 Octavia, 49 Otto Street, Krugersdorp North",
    note: "Office for NPC administration only — not a training venue",
    contacts: [],
  },
];

export default function ContactInfo() {
  return (
    <Reveal delay={150} className="contact-info">
      <h2>Contact info</h2>

      {locations.map((location, index) => (
        <Reveal key={location.name} delay={200 + index * 120} className="contact-location">
          <h3>{location.name}</h3>
          <p className="contact-location-address">&#128205; {location.address}</p>
          <p className="contact-location-note">{location.note}</p>

          {location.contacts.map((contact) => (
            <div key={contact.label} className="contact-location-detail">
              <span className="contact-location-detail-label">{contact.label}</span>
              <span>&#128222; {contact.phone}</span>
              <span>&#9993; {contact.email}</span>
            </div>
          ))}
        </Reveal>
      ))}
    </Reveal>
  );
}