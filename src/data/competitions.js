import { adminCrud, createRemoteCollection } from "../lib/collections";

// Visitors get a teaser; logged-in members get registration and payment details.
export const competitionsStore = createRemoteCollection("/api/competitions");
export const competitionsAdmin = adminCrud("/api/admin/competitions", competitionsStore);

export const DEFAULT_COMPETITION_IMAGE = "/uploads/public/default-competition.jpeg";

// The server works the status out (it depends on dates and whether a link exists).
export function getCompetitionStatus(competition) {
  return competition.status || competition.registrationStatus || "Registration link pending";
}
