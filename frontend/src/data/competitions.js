import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_COMPETITION_IMAGE = "/src/assets/images/Logo/wrja-logo.png";

export const competitions = [
  {
    id: "comp-1",
    slug: "spring-open",
    name: "Spring Open",
    type: "Competition",
    description: "A local judo event for developing athletes and new competitors.",
    date: "2026-10-10",
    location: "Johannesburg",
    image: DEFAULT_COMPETITION_IMAGE,
    displayOrder: 1,
    registrationUrl: "",
    registrationType: "external",
    paymentRequired: false,
  },
  {
    id: "comp-2",
    slug: "tracksuit-ordering",
    name: "Tracksuit ordering",
    type: "Store",
    description: "Official WRJA and JSA club kit ordering for members.",
    date: "2026-11-01",
    location: "Online",
    image: DEFAULT_COMPETITION_IMAGE,
    displayOrder: 2,
    registrationUrl: "",
    registrationType: "internal",
    paymentRequired: false,
  },
];

export const competitionsStore = createRemoteCollection("/api/competitions");
export const competitionsAdmin = adminCrud("/api/admin/competitions", competitionsStore);

export function getCompetitionStatus(competition) {
  if (!competition) return "Upcoming";
  const now = new Date();
  const date = competition.date ? new Date(`${competition.date}T12:00:00`) : null;
  if (date && date < now) return "Completed";
  return competition.registrationUrl ? "Open" : "Upcoming";
}

export default competitions;
