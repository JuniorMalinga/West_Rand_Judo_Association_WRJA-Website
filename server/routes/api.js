import { Router } from "express";
import * as repo from "../repo.js";
import * as v from "../validate.js";
import {
  currentSessionHash,
  DUMMY_HASH,
  endSession,
  hashPassword,
  requireAdmin,
  requireAuth,
  startSession,
  verifyPassword,
} from "../auth.js";
import { createLimiter, HttpError, rateLimit } from "../security.js";
import {
  deleteFileQuietly,
  deletePublicImage,
  privateFilePath,
  savePrivateProof,
  savePublicImage,
  uploadsSizeBytes,
} from "../uploads.js";

const router = Router();

const publicUser = (u) => ({
  id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email,
  phone: u.phone, dateOfBirth: u.dateOfBirth, role: u.role,
});

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

// =============================================================================
// AUTH
// =============================================================================
const loginFailuresByIp = createLimiter({ windowMs: 15 * MINUTE, max: 20 });
const loginFailuresByEmail = createLimiter({ windowMs: 15 * MINUTE, max: 5 });

router.post("/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 254);
  const password = String(req.body?.password || "").slice(0, 256);
  if (!email || !password) throw new HttpError(400, "Please enter your email and password.");

  const wait = Math.max(loginFailuresByIp.blocked(req.ip), loginFailuresByEmail.blocked(email));
  if (wait) {
    res.setHeader("Retry-After", String(wait));
    throw new HttpError(429, `Too many failed attempts. Please try again in ${Math.ceil(wait / 60)} minute(s).`);
  }

  const user = await repo.findUserByEmail(email);
  const valid = await verifyPassword(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !valid) {
    loginFailuresByIp.hit(req.ip);
    loginFailuresByEmail.hit(email);
    throw new HttpError(401, "Invalid email or password.");
  }

  loginFailuresByEmail.reset(email);
  await startSession(req, res, user);
  res.json({ success: true, user: publicUser(user) });
});

router.post("/auth/signup", rateLimit({ windowMs: HOUR, max: 10, message: "Too many sign-ups from this connection. Please try again later." }), async (req, res) => {
  const body = req.body || {};
  const role = v.oneOf(body.role || "athlete", ["athlete", "guardian"], "Account type"); // never 'admin'
  const dateOfBirth = role === "athlete" ? v.isoDate(body.dateOfBirth, { field: "Date of birth", required: true }) : "";
  if (role === "athlete" && v.calculateAge(dateOfBirth) < 18) {
    throw new HttpError(400, 'Athletes under 18 need a parent or guardian to create the account instead.');
  }

  const data = {
    firstName: v.text(body.firstName, { field: "First name", max: 60, required: true }),
    lastName: v.text(body.lastName, { field: "Last name", max: 60, required: true }),
    email: v.email(body.email),
    phone: v.text(body.phone, { field: "Phone", max: 40 }),
    dateOfBirth,
    role,
  };
  const passwordHash = await hashPassword(v.password(body.password));

  if (await repo.findUserByEmail(data.email)) throw new HttpError(409, "An account with this email already exists.");
  const user = await repo.createUser({ ...data, passwordHash });
  res.status(201).json({ success: true, user: publicUser(user) });
});

router.post("/auth/logout", async (req, res) => {
  await endSession(req, res);
  res.json({ success: true });
});

// 200 with user:null (rather than 401) so a logged-out visit doesn't log console errors.
router.get("/auth/me", (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

// =============================================================================
// PUBLIC / MEMBER CONTENT
// =============================================================================
function competitionStatus(c) {
  if (c.registrationStatus && c.registrationStatus !== "Registration link pending") return c.registrationStatus;
  if (c.date && new Date(c.date) < new Date()) return "Event Completed";
  return c.registrationUrl ? "Registration Open" : "Registration link pending";
}

// Visitors who aren't logged in only see the teaser – registration links and
// payment details are for members ("Log in to view competition details").
function serializeCompetition(c, loggedIn) {
  const status = competitionStatus(c);
  if (loggedIn) return { ...c, status };
  return {
    id: c.id, slug: c.slug, name: c.name, type: c.type, description: c.description, date: c.date,
    location: c.location, image: c.image, displayOrder: c.displayOrder, registrationStatus: c.registrationStatus, status,
  };
}

router.get("/competitions", async (req, res) => {
  const items = await repo.listCompetitions();
  res.json({ items: items.map((c) => serializeCompetition(c, Boolean(req.user))) });
});

router.get("/events", requireAuth, async (req, res) => {
  res.json({ items: await repo.listEvents() });
});

router.get("/news", async (req, res) => {
  res.json({ items: await repo.listNews() });
});

router.post(
  "/messages",
  rateLimit({ windowMs: HOUR, max: 8, message: "You've sent several messages recently. Please try again later." }),
  async (req, res) => {
    const body = req.body || {};
    // Hidden "website" field – real people never fill it in, bots do.
    if (String(body.website || "").trim()) return res.status(201).json({ success: true });

    const message = {
      name: v.text(body.name, { field: "Name", max: 100, required: true }),
      email: v.email(body.email),
      phone: v.text(body.phone, { field: "Phone", max: 40 }),
      message: v.text(body.message, { field: "Message", max: 3000, required: true, min: 5 }),
      source: v.text(body.source, { field: "Source", max: 120 }) || "Contact page",
    };
    await repo.addMessage(message);
    return res.status(201).json({ success: true });
  }
);

// ---- Proof of payment (members) ---------------------------------------------
router.post(
  "/payments",
  requireAuth,
  rateLimit({ windowMs: HOUR, max: 20, key: (req) => `pop:${req.user.id}`, message: "Too many uploads. Please try again later." }),
  async (req, res) => {
    const body = req.body || {};
    let competitionName = "Other / not listed";
    let competitionSlug = "";
    if (body.competitionSlug) {
      const competition = await repo.getCompetition(String(body.competitionSlug));
      if (!competition) throw new HttpError(400, "That competition doesn't exist.");
      competitionName = competition.name;
      competitionSlug = competition.slug;
    }

    const saved = savePrivateProof(body.dataUrl);
    const payment = await repo.addPayment({
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`.trim(),
      userEmail: req.user.email,
      competitionSlug,
      competitionName,
      fileName: v.text(String(body.fileName || "proof").replace(/[^\w .()-]/g, "_"), { field: "File name", max: 120 }) || "proof",
      fileSize: saved.size,
      fileType: saved.type,
      storedName: saved.storedName,
    });
    res.status(201).json({ success: true, item: payment });
  }
);

router.get("/payments/mine", requireAuth, async (req, res) => {
  res.json({ items: await repo.listPaymentsForUser(req.user.id) });
});

// The file itself: only the person who uploaded it, or an admin.
router.get("/payments/:id/file", requireAuth, async (req, res) => {
  const payment = await repo.getPaymentWithFile(req.params.id);
  if (!payment || (req.user.role !== "admin" && payment.userId !== req.user.id)) throw new HttpError(404, "File not found.");
  const filePath = privateFilePath(payment.storedName);
  if (!filePath) throw new HttpError(404, "File not found.");

  res.setHeader("Content-Type", payment.fileType); // verified against the file signature at upload
  res.setHeader("Content-Disposition", `inline; filename="${payment.fileName.replace(/"/g, "")}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.sendFile(filePath, (error) => {
    if (error && !res.headersSent) res.status(404).json({ success: false, error: "File not found." });
  });
});

// =============================================================================
// ADMIN  (everything below requires an administrator – checked on the server)
// =============================================================================
const admin = Router();
admin.use(requireAdmin);

admin.get("/counts", async (req, res) => {
  res.json({ ...(await repo.adminCounts()), uploadsBytes: uploadsSizeBytes() });
});

// ---- Image uploads ----------------------------------------------------------
admin.post("/uploads", rateLimit({ windowMs: HOUR, max: 200, key: (req) => `up:${req.user.id}` }), async (req, res) => {
  res.status(201).json({ url: savePublicImage(req.body?.dataUrl) });
});

// ---- Competitions -----------------------------------------------------------
const REGISTRATION_STATUSES = [
  "Registration Open", "Registration Not Yet Open", "Registration Closing Soon",
  "Registration Closed", "Event Completed", "Registration link pending",
];
const REGISTRATION_TYPES = ["external", "internal", "order"];

function cleanCompetition(body) {
  const paymentRequired = Boolean(body.paymentRequired);
  return {
    name: v.text(body.name, { field: "Name", max: 120, required: true }),
    type: v.text(body.type, { field: "Type", max: 60, required: true }),
    description: v.text(body.description, { field: "Description", max: 2000 }),
    date: v.isoDate(body.date),
    location: v.text(body.location, { field: "Location", max: 160 }),
    registrationDeadline: v.isoDate(body.registrationDeadline, { field: "Registration deadline" }),
    registrationStatus: v.oneOf(body.registrationStatus || "Registration link pending", REGISTRATION_STATUSES, "Status"),
    registrationType: v.oneOf(body.registrationType || "external", REGISTRATION_TYPES, "Registration type"),
    registrationUrl: v.httpUrl(body.registrationUrl, "Registration URL"),
    paymentRequired,
    paymentInstructions: paymentRequired ? v.text(body.paymentInstructions, { field: "Payment instructions", max: 2000 }) : "",
    paymentUrl: paymentRequired ? v.httpUrl(body.paymentUrl, "Payment URL") : "",
    image: v.uploadedImage(body.image) || "/uploads/public/default-competition.jpg",
    additionalInfo: v.text(body.additionalInfo, { field: "Additional information", max: 2000 }),
    displayOrder: v.integer(body.displayOrder, { field: "Display order", min: 1, max: 9999, fallback: 99 }),
  };
}

const slugify = (value) =>
  String(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "competition";

async function cleanupImages(paths) {
  for (const p of paths) if (p && !(await repo.isImageReferenced(p))) deletePublicImage(p);
}

admin.post("/competitions", async (req, res) => {
  const data = cleanCompetition(req.body || {});
  const existing = await repo.competitionSlugs();
  let slug = slugify(data.name);
  for (let n = 2; existing.includes(slug); n += 1) slug = `${slugify(data.name)}-${n}`;
  const item = await repo.saveCompetition({ ...data, id: slug, slug }, { create: true });
  res.status(201).json({ item });
});

admin.put("/competitions/:id", async (req, res) => {
  const current = await repo.getCompetition(req.params.id);
  if (!current) throw new HttpError(404, "Competition not found.");
  const item = await repo.saveCompetition({ ...cleanCompetition(req.body || {}), id: current.id, slug: current.slug }, { create: false });
  await cleanupImages([current.image]);
  res.json({ item });
});

admin.delete("/competitions/:id", async (req, res) => {
  const current = await repo.getCompetition(req.params.id);
  if (!current) throw new HttpError(404, "Competition not found.");
  await repo.deleteCompetition(current.id);
  await cleanupImages([current.image]);
  res.json({ success: true });
});

// ---- Events -----------------------------------------------------------------
function cleanEvent(body) {
  return {
    name: v.text(body.name, { field: "Event name", max: 140, required: true }),
    type: v.text(body.type, { field: "Type", max: 60, required: true }),
    date: v.isoDate(body.date, { required: true }),
    location: v.text(body.location, { field: "Location", max: 160, required: true }),
    description: v.text(body.description, { field: "Description", max: 3000 }),
    image: v.uploadedImage(body.image) || "/uploads/public/default-event.jpg",
    applicationSheetUrl: v.httpUrl(body.applicationSheetUrl, "Application link"),
    qrCodeImage: v.uploadedImage(body.qrCodeImage, "QR code"),
  };
}

const idParam = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, "Not found.");
  return id;
};

admin.post("/events", async (req, res) => {
  res.status(201).json({ item: await repo.saveEvent(cleanEvent(req.body || {}), { create: true }) });
});

admin.put("/events/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const current = await repo.getEvent(id);
  if (!current) throw new HttpError(404, "Event not found.");
  const item = await repo.saveEvent({ ...cleanEvent(req.body || {}), id }, { create: false });
  await cleanupImages([current.image, current.qrCodeImage]);
  res.json({ item });
});

admin.delete("/events/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const current = await repo.getEvent(id);
  if (!current) throw new HttpError(404, "Event not found.");
  await repo.deleteEvent(id);
  await cleanupImages([current.image, current.qrCodeImage]);
  res.json({ success: true });
});

// ---- News -------------------------------------------------------------------
const formatNewsDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

function cleanNews(body) {
  const sortDate = v.isoDate(body.sortDate, { field: "Date", required: true });
  return {
    title: v.text(body.title, { field: "Title", max: 200, required: true }),
    sortDate,
    date: formatNewsDate(sortDate),
    category: v.text(body.category, { field: "Category", max: 60, required: true }),
    excerpt: v.text(body.excerpt, { field: "Summary", max: 1500, required: true }),
    body: v.text(body.body, { field: "Full story", max: 20000 }),
    image: v.uploadedImage(body.image) || "/uploads/public/default-news.jpg",
    source: v.text(body.source, { field: "Source", max: 120 }),
    url: v.httpUrl(body.url, "Source URL"),
  };
}

admin.post("/news", async (req, res) => {
  res.status(201).json({ item: await repo.saveNews(cleanNews(req.body || {}), { create: true }) });
});

admin.put("/news/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const current = await repo.getNews(id);
  if (!current) throw new HttpError(404, "Post not found.");
  const item = await repo.saveNews({ ...cleanNews(req.body || {}), id }, { create: false });
  await cleanupImages([current.image]);
  res.json({ item });
});

admin.delete("/news/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const current = await repo.getNews(id);
  if (!current) throw new HttpError(404, "Post not found.");
  await repo.deleteNews(id);
  await cleanupImages([current.image]);
  res.json({ success: true });
});

// ---- Messages ---------------------------------------------------------------
admin.get("/messages", async (req, res) => res.json({ items: await repo.listMessages() }));

admin.post("/messages/read-all", async (req, res) => {
  await repo.markAllMessagesRead();
  res.json({ success: true });
});

admin.patch("/messages/:id", async (req, res) => {
  const status = v.oneOf(req.body?.status, ["new", "read"], "Status");
  const item = await repo.setMessageStatus(req.params.id, status);
  if (!item) throw new HttpError(404, "Message not found.");
  res.json({ item });
});

admin.delete("/messages/:id", async (req, res) => {
  if (!(await repo.deleteMessage(req.params.id))) throw new HttpError(404, "Message not found.");
  res.json({ success: true });
});

// ---- Payments ---------------------------------------------------------------
admin.get("/payments", async (req, res) => res.json({ items: await repo.listPayments() }));

admin.patch("/payments/:id", async (req, res) => {
  const status = v.oneOf(req.body?.status, ["Submitted for review", "Approved", "Rejected"], "Status");
  const item = await repo.setPaymentStatus(req.params.id, status);
  if (!item) throw new HttpError(404, "Submission not found.");
  res.json({ item });
});

admin.delete("/payments/:id", async (req, res) => {
  const removed = await repo.deletePayment(req.params.id);
  if (!removed) throw new HttpError(404, "Submission not found.");
  const filePath = privateFilePath(removed.storedName);
  if (filePath) deleteFileQuietly(filePath);
  res.json({ success: true });
});

// ---- Users ------------------------------------------------------------------
const ROLES = ["athlete", "guardian", "admin"];

admin.get("/users", async (req, res) => res.json({ items: (await repo.listUsers()).map(publicUser) }));

admin.post("/users", async (req, res) => {
  const body = req.body || {};
  const data = {
    firstName: v.text(body.firstName, { field: "First name", max: 60, required: true }),
    lastName: v.text(body.lastName, { field: "Last name", max: 60, required: true }),
    email: v.email(body.email),
    phone: v.text(body.phone, { field: "Phone", max: 40 }),
    role: v.oneOf(body.role || "athlete", ROLES, "Role"),
  };
  const passwordHash = await hashPassword(v.password(body.password));
  if (await repo.findUserByEmail(data.email)) throw new HttpError(409, "An account with this email already exists.");
  res.status(201).json({ item: publicUser(await repo.createUser({ ...data, passwordHash })) });
});

admin.put("/users/:id", async (req, res) => {
  const body = req.body || {};
  const current = await repo.findUserById(req.params.id);
  if (!current) throw new HttpError(404, "User not found.");

  const changes = {
    firstName: v.text(body.firstName, { field: "First name", max: 60, required: true }),
    lastName: v.text(body.lastName, { field: "Last name", max: 60, required: true }),
    email: v.email(body.email),
    phone: v.text(body.phone, { field: "Phone", max: 40 }),
    role: v.oneOf(body.role || current.role, ROLES, "Role"),
  };

  const isSelf = current.id === req.user.id;
  if (isSelf && changes.role !== current.role) throw new HttpError(400, "You can't change your own role.");
  if (current.role === "admin" && changes.role !== "admin" && (await repo.countAdmins()) <= 1) {
    throw new HttpError(400, "There must be at least one administrator.");
  }

  const other = await repo.findUserByEmail(changes.email);
  if (other && other.id !== current.id) throw new HttpError(409, "An account with this email already exists.");

  let passwordChanged = false;
  if (body.password) {
    changes.passwordHash = await hashPassword(v.password(body.password));
    passwordChanged = true;
  }

  const item = await repo.updateUser(current.id, changes);

  // A changed password or role signs that person out everywhere (except this browser if it's you).
  if (passwordChanged || changes.role !== current.role) {
    await repo.deleteUserSessions(current.id, isSelf ? currentSessionHash(req) : null);
  }
  res.json({ item: publicUser(item) });
});

admin.delete("/users/:id", async (req, res) => {
  const current = await repo.findUserById(req.params.id);
  if (!current) throw new HttpError(404, "User not found.");
  if (current.id === req.user.id) throw new HttpError(400, "You can't delete your own account.");
  if (current.role === "admin") throw new HttpError(400, "Administrators can't be deleted.");
  await repo.deleteUser(current.id);
  res.json({ success: true });
});

router.use("/admin", admin);

export default router;
