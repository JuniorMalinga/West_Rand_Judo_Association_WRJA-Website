import { Link } from "react-router-dom";
import wrjaLogo from "../assets/images/Logo/wrja-logo.png";
import { clubLocations } from "../data/clubContacts";
import { toTelHref } from "../lib/format";

// Import the real gallery data instead of using placeholder images.
import galleryItems from "../data/galleryItems";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-about">
          <div className="footer-logo">
            <span className="nav-logo-badge">
              <img
                src={wrjaLogo}
                alt="West Rand Judo Association"
                className="footer-logo-image"
              />
            </span>
          </div>

          <p>
            West Rand Judo Association has offered structured, safe judo
            training to the local community, welcoming athletes of all ages
            and grades.
          </p>

          <div className="footer-socials">
            <a
              href="https://www.facebook.com/share/1DgzXXuN9M/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              FB
            </a>
          </div>
        </div>

        <div className="footer-contacts">
          <h3>Contacts</h3>

          <p>West Rand Judo Association NPC</p>

          <p>
            Office (NPC only): 3 Octavia, 49 Otto Street, Krugersdorp North
          </p>

          <p>
            For training enquiries, contact Golden Score Judo or KJK Judo
            Club directly.
          </p>

          {clubLocations.flatMap((location) => location.contacts.map((contact) => (
            <p key={`${location.name}-${contact.label}`} className="footer-contact-line">
              <strong>{contact.label === "Contact" ? location.name : `${location.name} – ${contact.label}`}</strong>
              <br />
              <a href={toTelHref(contact.phone)}>{contact.phone}</a>
              {" · "}
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
          )))}

          <p>
            <Link to="/contact" className="footer-contact-link">Send us a message &rarr;</Link>
          </p>
        </div>

        <div className="footer-gallery">
          <h3>Gallery</h3>

          <div className="footer-gallery-grid">
            {/* Use the real gallery images from galleryItems */}
            {galleryItems.slice(0, 8).map((item) => (
              <img
                key={item.id}
                src={item.photoUrl}
                alt={item.caption}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} West Rand Judo Association. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
}