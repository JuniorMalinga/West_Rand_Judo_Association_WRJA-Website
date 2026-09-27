import competition1 from "../assets/images/gallery/Competition 1.jpg";
import competition2 from "../assets/images/gallery/Competition 2.jpg";
import competition3 from "../assets/images/gallery/Competition 3.jpg";
import competition4 from "../assets/images/gallery/Competition 4.jpg";

const competitionImage = [competition1, competition2, competition3, competition4];

export const defaultCompetitions = [
  ["nre", "NRE", "National Ranking Event", true],
  ["west-rand-grand-slam", "West Rand Grand Slam", "Competition", true],
  ["west-rand-grand-slam-kata", "West Rand Grand Slam Kata", "Kata competition", true],
  ["gauteng-open", "Gauteng Open", "Competition", false],
  ["gauteng-kata", "Gauteng Kata", "Kata competition", false],
  ["africa-open", "Africa Open", "International competition", true],
  ["jsa-registration", "JSA Registration", "Annual registration", true],
  ["sa-open", "SA Open", "National competition", true],
  ["sa-schools-novice", "SA Schools Novice", "Schools competition", true],
  ["sa-schools-advanced", "SA Schools Advanced", "Schools competition", true],
  ["tracksuit-ordering", "WRJA & JSA Tracksuit Ordering", "Club ordering", true],
  ["flashers-ordering", "WRJA Flashers Ordering", "Club ordering", true],
].map(([slug, name, type, paymentRequired], index) => ({
  id: slug,
  slug,
  name,
  type,
  description: paymentRequired && type === "Club ordering"
    ? "Order official WRJA kit and complete payment directly to WRJA."
    : `Registration information for the ${name}. Check the event details and complete the required registration steps.`,
  date: "",
  location: "Details to be announced",
  registrationDeadline: "",
  registrationStatus: "Registration link pending",
  registrationType: "external",
  registrationUrl: "",
  paymentRequired,
  paymentInstructions: paymentRequired ? "Payment to WRJA is required. The admin team will publish payment instructions here." : "",
  paymentUrl: "",
  image: competitionImage[index % competitionImage.length],
  additionalInfo: paymentRequired ? "Registration and payment requirements will be confirmed by WRJA." : "Registration is handled through the event organiser.",
  displayOrder: index + 1,
}));

export function getCompetitions() {
  const stored = window.localStorage.getItem("wrja.competitions");
  if (!stored) {
    window.localStorage.setItem("wrja.competitions", JSON.stringify(defaultCompetitions));
    return defaultCompetitions;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((item, index) => ({ ...(defaultCompetitions[index] || {}), ...item }));
  } catch {
    return defaultCompetitions;
  }
}

export function saveCompetitions(competitions) {
  window.localStorage.setItem("wrja.competitions", JSON.stringify(competitions));
  window.dispatchEvent(new Event("wrja:competitions-updated"));
}

export function getCompetitionStatus(competition) {
  if (competition.registrationStatus && competition.registrationStatus !== "Registration link pending") return competition.registrationStatus;
  if (competition.date && new Date(competition.date) < new Date()) return "Event Completed";
  return competition.registrationUrl ? "Registration Open" : "Registration link pending";
}
