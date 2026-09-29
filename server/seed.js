// Fills an empty database with the site's starting content.
// Runs automatically on first start; `npm run db:reset` wipes and re-runs it.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as repo from "./repo.js";
import { hashPassword, verifyPassword } from "./auth.js";
import { ensureSeedAssets } from "./uploads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const img = (name) => `/uploads/public/${name}`;

// Default logins (kept as requested – change them before going live).
const DEFAULT_USERS = [
  { firstName: "WRJA", lastName: "Admin", email: "admin@wrja.co.za", password: "Admin123!", role: "admin" },
  { firstName: "Test", lastName: "User", email: "user@wrja.co.za", password: "User123!", role: "athlete" },
];

const COMPETITIONS = [
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
];

const GRADING_SHEET = "https://docs.google.com/spreadsheets/d/138pFFvZxT-s6YzoS4eAARgQkZGQdmlJ1i8FOzhauuYE/edit?gid=0#gid=0";

const EVENTS = [
  { name: "Placeholder grading", type: "Grading", date: "2026-09-12", location: "Special dojo", image: img("default-event.jpg"),
    description: "Placeholder description of what this grading covers, who can attend, and what to bring.",
    applicationSheetUrl: GRADING_SHEET, qrCodeImage: img("seed-qr.png") },
  { name: "Placeholder provincial competition", type: "Competition", date: "2026-10-10", location: "Placeholder venue", image: img("seed-comp-2.jpg"),
    description: "Placeholder description of the competition, weight categories, and entry requirements.",
    applicationSheetUrl: "", qrCodeImage: "" },
  { name: "Placeholder training camp", type: "Training camp", date: "2026-11-21", location: "Placeholder venue", image: img("seed-event-camp.jpg"),
    description: "Placeholder description of the training camp schedule and what athletes should bring.",
    applicationSheetUrl: "", qrCodeImage: "" },
  { name: "Placeholder grading", type: "Grading", date: "2026-11-21", location: "Special dojo", image: img("default-event.jpg"),
    description: "Placeholder description of what this grading covers, who can attend, and what to bring.",
    applicationSheetUrl: GRADING_SHEET, qrCodeImage: img("seed-qr.png") },
];

export async function seedIfEmpty() {
  ensureSeedAssets();

  if (await repo.tableIsEmpty("users")) {
    for (const { password, ...user } of DEFAULT_USERS) {
      await repo.createUser({ ...user, passwordHash: await hashPassword(password) });
    }
    console.log("Seeded default users.");
  }

  if (await repo.tableIsEmpty("competitions")) {
    for (const [index, [slug, name, type, paymentRequired]] of COMPETITIONS.entries()) {
      await repo.saveCompetition({
        id: slug, slug, name, type,
        description: paymentRequired && type === "Club ordering"
          ? "Order official WRJA kit and complete payment directly to WRJA."
          : `Registration information for the ${name}. Check the event details and complete the required registration steps.`,
        date: "", location: "Details to be announced", registrationDeadline: "",
        registrationStatus: "Registration link pending", registrationType: "external", registrationUrl: "",
        paymentRequired,
        paymentInstructions: paymentRequired ? "Payment to WRJA is required. The admin team will publish payment instructions here." : "",
        paymentUrl: "",
        image: img(`seed-comp-${(index % 4) + 1}.jpg`),
        additionalInfo: paymentRequired
          ? "Registration and payment requirements will be confirmed by WRJA."
          : "Registration is handled through the event organiser.",
        displayOrder: index + 1,
      }, { create: true });
    }
    console.log("Seeded competitions.");
  }

  if (await repo.tableIsEmpty("events")) {
    for (const event of EVENTS) await repo.saveEvent(event, { create: true });
    console.log("Seeded events.");
  }

  if (await repo.tableIsEmpty("news")) {
    const posts = JSON.parse(fs.readFileSync(path.join(__dirname, "seed-news.json"), "utf8"));
    // oldest first so ids rise with time
    for (const post of [...posts].reverse()) {
      await repo.saveNews({ ...post, body: "", image: img(post.image) }, { create: true });
    }
    console.log("Seeded news.");
  }

  // Be upfront that the well-known default admin login is still active.
  const admin = await repo.findUserByEmail(DEFAULT_USERS[0].email);
  if (admin && (await verifyPassword(DEFAULT_USERS[0].password, admin.passwordHash))) {
    console.warn("⚠  The default admin login (admin@wrja.co.za / Admin123!) is still active. Change it before going live.");
  }
}
