import { adminCrud, createRemoteCollection } from "../lib/collections";

export const DEFAULT_COMPETITION_IMAGE = "/uploads/public/default-competition.jpeg";

export const competitionsStore = createRemoteCollection("/api/competitions");
export const competitionsAdmin = adminCrud("/api/admin/competitions", competitionsStore);

export function getCompetitionStatus(competition) {
  if (!competition) return "Upcoming";
  const now = new Date();
  const date = competition.date ? new Date(`${competition.date}T12:00:00`) : null;
  if (date && date < now) return "Completed";
  return competition.registrationUrl ? "Open" : "Upcoming";
}
