import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import UpcomingEventsList from "../components/UpcomingEventsList";
import EventsCalendar from "../components/EventsCalendar";
import Reveal from "../components/Reveal";
import CompetitionCard from "../components/CompetitionCard";
import { getCompetitions } from "../data/competitions";

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
  const competitions = getCompetitions()
    .filter((item) => !["Schools competition", "Club ordering"].includes(item.type))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <CategoryHeader title="Competitions" description="The same WRJA competition content is available here as a convenient part of the Events hub." />
      <section className="events-category-actions">
        <Link to="/competitions" className="btn btn-accent">Open standalone Competitions page</Link>
      </section>
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
  const competitions = getCompetitions().filter((item) => ["sa-schools-novice", "sa-schools-advanced"].includes(item.slug));

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
  const tracksuit = getCompetitions().find((item) => item.slug === "tracksuit-ordering");

  return (
    <>
      <CategoryHeader title="Store" description="Get the kit and club materials that help WRJA athletes represent the association with pride." />
      <section className="events-store-grid" aria-label="WRJA store items">
        <Reveal>
          <article className="events-store-card">
            <div className="events-store-card-mark">KIT</div>
            <p className="eyebrow">WRJA &amp; JSA</p>
            <h2>Tracksuits</h2>
            <p>Order official WRJA and JSA tracksuits. The existing WRJA ordering and payment flow is used for this item.</p>
            {tracksuit ? <Link to={`/competitions/${tracksuit.slug}`} className="btn btn-accent">View tracksuit ordering</Link> : <Link to="/contact" className="btn btn-accent">Contact WRJA</Link>}
          </article>
        </Reveal>
        <Reveal delay={80}>
          <article className="events-store-card">
            <div className="events-store-card-mark">WRJA</div>
            <p className="eyebrow">CLUB MATERIALS</p>
            <h2>WRJA Posters</h2>
            <p>Request official WRJA posters for your dojo, school or event. Contact the association to confirm availability and collection details.</p>
            <Link to="/contact" className="btn btn-outline-dark">Enquire about posters</Link>
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
