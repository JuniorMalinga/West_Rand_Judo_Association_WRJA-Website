import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import UpcomingEventsList from "../components/UpcomingEventsList";
import EventsCalendar from "../components/EventsCalendar";
import Reveal from "../components/Reveal";
import CompetitionCard from "../components/CompetitionCard";
import { competitionsStore } from "../data/competitions";
import useCollection from "../hooks/useCollection";
import wrjaLogo from "../assets/images/Logo/wrja-logo.png";

const hubCards = [
  {
    slug: "calendar",
    eyebrow: "DATES & FIXTURES",
    title: "Calendar",
    description: "View upcoming WRJA events, training milestones and important dates.",
    action: "Open calendar",
  },
  {
    slug: "competitions",
    eyebrow: "ON THE MAT",
    title: "Competitions",
    description: "Find registrations, payment requirements and information for every competition.",
    action: "Explore competitions",
  },
  {
    slug: "schools",
    eyebrow: "SCHOOL JUDO",
    title: "Schools",
    description: "Explore the SA Schools Novice and SA Schools Advanced pathways.",
    action: "View schools events",
  },
  {
    slug: "store",
    eyebrow: "WRJA KIT",
    title: "Store",
    description: "Order WRJA and JSA tracksuits and request official WRJA posters.",
    action: "Visit store",
  },
];

function CategoryHeader({ title, description }) {
  return (
    <section className="events-category-intro">
      <p className="eyebrow">EVENTS / {title.toUpperCase()}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to="/events" className="events-back-link">← Back to Events hub</Link>
    </section>
  );
}

function CalendarView() {
  return (
    <>
      <CategoryHeader title="Calendar" description="Keep track of upcoming WRJA events and important dates." />
      <section className="events-page-layout events-category-layout">
        <UpcomingEventsList />
        <EventsCalendar />
      </section>
    </>
  );
}

function CompetitionsView() {
  const competitions = [...useCollection(competitionsStore)]
    .filter((item) => !["Schools competition", "Club ordering"].includes(item.type))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <CategoryHeader title="Competitions" description="The same WRJA competition content is available here as a convenient part of the Events hub." />
      <section className="competitions-grid events-embedded-competitions" aria-label="Competitions available through Events">
        {competitions.map((competition, index) => (
          <Reveal key={competition.id} delay={index * 45}>
            <CompetitionCard competition={competition} />
          </Reveal>
        ))}
      </section>
    </>
  );
}

function SchoolsView() {
  const competitions = useCollection(competitionsStore).filter((item) => ["sa-schools-novice", "sa-schools-advanced"].includes(item.slug));

  return (
    <>
      <CategoryHeader title="Schools" description="School-focused competition opportunities for developing judoka across the West Rand and Gauteng." />
      <section className="competitions-grid events-embedded-competitions" aria-label="Schools competitions">
        {competitions.map((competition, index) => (
          <Reveal key={competition.id} delay={index * 70}>
            <CompetitionCard competition={competition} />
          </Reveal>
        ))}
      </section>
    </>
  );
}

function StoreView() {
  const tracksuit = useCollection(competitionsStore).find((item) => item.slug === "tracksuit-ordering");

  return (
    <>
      <section className="store-hero">
        <div className="store-hero-copy">
          <Link to="/events" className="store-back-link">← Events hub</Link>
          <p className="eyebrow">WRJA MERCH / OFFICIAL COLLECTION</p>
          <h1>Represent the club.<br /><span>On and off the mat.</span></h1>
          <p>Official WRJA apparel and club prints for athletes, coaches, families and supporters.</p>
          <div className="store-hero-chips"><span>Official WRJA</span><span>JSA collection</span><span>Made to order</span></div>
        </div>
        <div className="store-hero-mark" aria-hidden="true"><img src={wrjaLogo} alt="" /><span>EST. WRJA</span></div>
      </section>
      <div className="store-collection-bar"><div><span className="eyebrow">THE WRJA COLLECTION</span><h2>Club essentials</h2></div><span className="store-collection-count">02 products</span></div>
      <section className="events-store-grid" aria-label="WRJA store items">
        <Reveal>
          <article className="events-store-card">
            <div className="events-store-product-image" style={{ backgroundImage: `url("${tracksuit?.image || wrjaLogo}")` }}>
              <span className="events-store-badge">WRJA KIT</span>
            </div>
            <div className="events-store-card-content">
              <div className="events-store-card-topline"><p className="eyebrow">WRJA &amp; JSA</p><span className="events-store-stock">Official kit</span></div>
              <h2>Tracksuits</h2>
              <p>Official WRJA and JSA tracksuits for athletes, coaches and supporters. Select your requirements through the WRJA ordering flow.</p>
              <div className="events-store-card-footer"><strong>Order by enquiry</strong>{tracksuit ? <Link to={`/events/competitions/${tracksuit.slug}`} className="btn btn-accent">Shop tracksuits</Link> : <Link to="/contact?topic=Tracksuit%20order" className="btn btn-accent">Contact WRJA</Link>}</div>
            </div>
          </article>
        </Reveal>
        <Reveal delay={80}>
          <article className="events-store-card">
            <div className="events-store-product-image events-store-product-poster" style={{ backgroundImage: `url("${wrjaLogo}")` }}>
              <span className="events-store-badge">WRJA PRINT</span>
            </div>
            <div className="events-store-card-content">
              <div className="events-store-card-topline"><p className="eyebrow">CLUB MATERIALS</p><span className="events-store-stock">Made to order</span></div>
              <h2>WRJA Posters</h2>
              <p>Bring the WRJA spirit to your dojo, school or event space with official association posters.</p>
              <div className="events-store-card-footer"><strong>Order by enquiry</strong><Link to="/contact?topic=WRJA%20poster%20order" className="btn btn-outline-dark">Shop posters</Link></div>
            </div>
          </article>
        </Reveal>
      </section>
    </>
  );
}

export default function EventsPage({ section }) {
  if (section === "calendar") return <div className="events-page"><PageHeader title="Calendar" crumbs={[{ label: "Events", to: "/events" }]} /><CalendarView /></div>;
  if (section === "competitions") return <div className="events-page"><PageHeader title="Competitions" crumbs={[{ label: "Events", to: "/events" }]} /><CompetitionsView /></div>;
  if (section === "schools") return <div className="events-page"><PageHeader title="Schools" crumbs={[{ label: "Events", to: "/events" }]} /><SchoolsView /></div>;
  if (section === "store") return <div className="events-page"><PageHeader title="Store" crumbs={[{ label: "Events", to: "/events" }]} /><StoreView /></div>;

  return (
    <div className="events-page">
      <PageHeader title="Events" />
      <section className="events-hub-intro">
        <Reveal>
          <p className="eyebrow">YOUR WRJA EVENT HUB</p>
          <h1>Everything happening <span className="text-accent">around the mat.</span></h1>
          <p>Explore the calendar, competitions, school pathways and official WRJA kit from one clear starting point.</p>
        </Reveal>
      </section>
      <section className="events-hub-grid" aria-label="Events hub categories">
        {hubCards.map((card, index) => (
          <Reveal key={card.slug} delay={index * 70}>
            <Link to={`/events/${card.slug}`} className="events-hub-card">
              <span className="events-hub-card-icon" aria-hidden="true">{card.slug === "calendar" ? "CAL" : card.slug === "competitions" ? "MAT" : card.slug === "schools" ? "DOJO" : "KIT"}</span>
              <span className="events-hub-card-number">0{index + 1}</span>
              <p className="eyebrow">{card.eyebrow}</p>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <span className="events-hub-card-action">{card.action} <span aria-hidden="true">→</span></span>
            </Link>
          </Reveal>
        ))}
      </section>
      <section className="events-calendar-cta">
        <div>
          <p className="eyebrow">PLAN YOUR SEASON</p>
          <h2>Looking for dates?</h2>
          <p>Open the WRJA calendar to see upcoming events, fixtures and important club milestones.</p>
        </div>
        <Link to="/events/calendar" className="btn btn-accent">View the calendar <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
