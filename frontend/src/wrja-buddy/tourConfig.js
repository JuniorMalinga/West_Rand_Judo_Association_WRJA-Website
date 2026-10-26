export const TOUR_ORDER = ["/", "/about", "/gallery", "/faq", "/instructors", "/news", "/contact", "/signup", "/events", "/profile"];

export const TOUR_ROUTES = {
  "/": {
    label: "the home page",
    intro: "Welcome to West Rand Judo Association. I’ll show you the parts that help you find your place on the mat.",
    sections: [
      { id: "competition", selector: ".competitions-home-section", message: "This is the competition area — a quick view of what is coming next on the mat.", animation: "excited" },
      { id: "about", selector: ".about", message: "Here you can learn how WRJA builds character on and off the mat.", animation: "thinking" },
      { id: "features", selector: ".features", message: "These are the practical things WRJA offers, from training information to ways to get involved.", animation: "pointRight" },
      { id: "trainers", selector: ".trainers", message: "Meet the instructors and see the experience behind the club.", animation: "proud" },
      { id: "news", selector: ".news", message: "The news section keeps announcements and club updates in one place.", animation: "thinking" },
      { id: "location", selector: ".location", message: "This section helps you find the affiliated clubs and plan where to train.", animation: "point" },
    ],
  },
  "/about": {
    label: "the About page",
    intro: "This page explains WRJA’s story, values, and the people who help the association grow.",
    sections: [
      { id: "about-story", selector: ".about", message: "This section introduces WRJA and the values behind the association. It is a good starting point if you are new to the club.", animation: "bow" },
      { id: "about-features", selector: ".features", message: "Here you can compare practical parts of training, including schedules, grading, equipment, and coaching.", animation: "thinking" },
      { id: "about-coaches", selector: ".trainers", message: "Meet the coaches and get a sense of the experience guiding WRJA athletes.", animation: "proud" },
      { id: "about-news", selector: ".news", message: "This area highlights recent association news. Open a story to read the full update.", animation: "pointRight" },
      { id: "about-mission", selector: ".about-mission", message: "The mission section explains WRJA’s goals for athlete confidence, discipline, respect, and opportunity on and off the mat.", animation: "thinking" },
      { id: "instructors", selector: ".instructors-page-section", message: "Explore the instructor profiles for each coach’s qualifications, experience, and role in the club.", animation: "proud" },
      { id: "club-links", selector: ".club-links", message: "These club links help you find the affiliated dojos and choose where to ask about training.", animation: "point" },
    ],
  },
  "/gallery": {
    label: "the Gallery page",
    intro: "This is where WRJA’s training, competition, and community moments come together.",
    sections: [
      { id: "gallery-controls", selector: ".gallery-section", message: "Use the gallery categories to narrow the photos to the kind of club moment you want to see.", animation: "thinking" },
      { id: "gallery-grid", selector: ".gallery-grid", message: "Select a photo to view it larger. Use the page controls below the grid when more photos are available.", animation: "excited" },
    ],
  },
  "/instructors": {
    label: "the Instructors page",
    intro: "Meet the instructors who help WRJA athletes grow on and off the mat.",
    sections: [
      { id: "instructors", selector: ".instructors-page-section", message: "Explore the instructor profiles for each coach’s qualifications, experience, and role in the club.", animation: "proud" },
    ],
  },
  "/faq": {
    label: "the FAQ page",
    intro: "The FAQ is a useful place to check common questions before getting in touch.",
    sections: [
      { id: "faq-answers", selector: ".faq-section", message: "Open a question to read its answer. This is the quickest way to check common information about WRJA.", animation: "thinking" },
      { id: "faq-contact", selector: ".faq-contact-cta", message: "If the FAQ does not cover your situation, use this link to send WRJA a direct enquiry.", animation: "pointRight" },
    ],
  },
  "/news": {
    label: "the News page",
    intro: "This is where the latest WRJA announcements and club stories appear.",
    sections: [
      { id: "news-highlights", selector: ".news-image", message: "The feature at the top highlights current WRJA stories. Use its controls to move between featured items.", animation: "curious" },
      { id: "news-sidebar", selector: ".news-sidebar", message: "Recent posts provide a quick route to updates without searching through the full list.", animation: "thinking" },
      { id: "news-list", selector: ".news-post-list", message: "Browse the full post list and use the pagination controls to continue through older updates. Open a story for its details.", animation: "pointRight" },
    ],
  },
  "/events": {
    label: "the members’ Events hub",
    protected: true,
    intro: "This is the members’ Events hub. It brings together calendars, competitions, school pathways, and official kit.",
    sections: [
      { id: "events-intro", selector: ".events-hub-intro", message: "The Events hub is the starting point for calendars, competitions, school pathways, and WRJA kit.", animation: "curious" },
      { id: "events-cards", selector: ".events-hub-grid", message: "Choose a category here to see the relevant events or member information.", animation: "pointRight" },
      { id: "events-calendar", selector: ".events-calendar-cta", message: "The calendar is the place to check dates, fixtures, and important club milestones.", animation: "readyStance" },
    ],
  },
  "/profile": {
    label: "your Profile page",
    protected: true,
    intro: "This is your Profile page, where you can review your account details and manage account security.",
    sections: [
      { id: "profile-details", selector: ".profile-details", message: "Your account details show the name, email, phone number, and account type connected to your WRJA account.", animation: "thinking" },
      { id: "profile-password", selector: ".profile-password-form", message: "Use this form to change your password. You’ll need your current password, and your new password must be at least 8 characters with a letter and a number.", animation: "pointRight" },
      { id: "profile-deletion", selector: ".profile-deletion-card", message: "If you ever want to close your website account, you can send WRJA a deletion request here. The account stays active until WRJA reviews and processes it.", animation: "thinking" },
    ],
  },
  "/signup": {
    label: "the sign-up page",
    intro: "Create your WRJA account here. Once your account is ready, you’ll sign in and we’ll continue the tour in the members’ Events hub.",
    sections: [
      { id: "signup-form", selector: ".signup-reference-form", message: "Fill in the form to create your WRJA account. After that, you’ll be taken to sign in so we can continue to Events.", animation: "pointRight" },
    ],
  },
  "/contact": {
    label: "the Contact page",
    intro: "This is the quickest place to reach WRJA directly with a question or enquiry.",
    sections: [
      { id: "contact-form", selector: ".contact-form-wrap", message: "Use the form for an enquiry and include enough detail for the team to direct it to the right club or person.", animation: "pointRight" },
      { id: "contact-details", selector: ".contact-info", message: "These are the club contact details, including addresses, phone numbers, and email links for training enquiries.", animation: "wave" },
      { id: "contact-map", selector: ".contact-map", message: "The map helps you locate the affiliated dojos and the WRJA office before you travel.", animation: "point" },
    ],
  },
};

export function normalizeTourPath(pathname) {
  if (pathname === "/" || pathname === "") return "/";
  if (pathname.startsWith("/events")) return "/events";
  if (pathname.startsWith("/profile")) return "/profile";
  if (pathname === "/instructors" || pathname.startsWith("/instructors/")) return "/instructors";
  if (pathname.startsWith("/news")) return "/news";
  if (pathname.startsWith("/gallery")) return "/gallery";
  if (pathname.startsWith("/about")) return "/about";
  if (pathname.startsWith("/contact")) return "/contact";
  return pathname;
}

export function getTourRoute(pathname) {
  return TOUR_ROUTES[normalizeTourPath(pathname)] || null;
}
