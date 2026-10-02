import { Router } from "express";
import * as eventsRepo from "../eventsRepo.js";
import * as newsRepo from "../newsRepo.js";
import * as contactMessagesRepo from "../contactMessagesRepo.js";
import * as paymentsRepo from "../paymentsRepo.js";
import * as systemRepo from "../systemRepo.js";
import * as mediaRepo from "../mediaRepo.js";
import * as adminUsersRepo from "../adminUsersRepo.js";
import * as v from "../validate.js";
import { authClient, clearSession, loadProfile, setSession, requireAdmin, requireAuth } from "../auth.js";
import { createUserClient } from "../supabase.js";
import { createLimiter, HttpError, rateLimit } from "../security.js";
import {
  preparePrivateProof,
  preparePublicImage,
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

  const client = authClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    loginFailuresByIp.hit(req.ip);
    loginFailuresByEmail.hit(email);
    throw new HttpError(401, "Invalid email or password.");
  }
  // Never trust a role supplied by the browser or user metadata.
  const profile = await loadProfile(createUserClient(data.session.access_token), data.user);
  loginFailuresByEmail.reset(email);
  setSession(req, res, data.session);
  res.json({ success: true, user: publicUser(profile) });
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
  const password = v.password(body.password);
  const client = authClient();
  const { data: signedUp, error } = await client.auth.signUp({
    email: data.email, password,
    options: { data: { first_name: data.firstName, last_name: data.lastName,
      phone: data.phone, date_of_birth: data.dateOfBirth, profile_role: data.role } },
  });
  if (error) throw new HttpError(400, error.message);
  // The database must create profiles with a trusted trigger; client metadata
  // is a signup request, not proof of a privileged role.
  res.status(201).json({ success: true, user: { ...data, id: signedUp.user?.id || null } });
});

router.post("/auth/logout", async (req, res) => {
  // Clearing both HttpOnly cookies signs out this browser.
  clearSession(req, res);
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
  const items = await eventsRepo.listCompetitions(req.accessToken);
  res.json({ items: items.map((c) => serializeCompetition(c, Boolean(req.user))) });
});

router.get("/events", requireAuth, async (req, res) => {
  res.json({ items: await eventsRepo.listEvents(req.accessToken) });
});

router.get("/news", async (req, res) => {
  res.json({ items: await newsRepo.listNews(req.accessToken) });
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
    await contactMessagesRepo.addMessage(message, req.accessToken, req.user?.id || null);
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
      const competition = await eventsRepo.getCompetition(String(body.competitionSlug), req.accessToken);
      if (!competition) throw new HttpError(400, "That competition doesn't exist.");
      competitionName = competition.name;
      competitionSlug = competition.slug;
    }

    const preparedFile = preparePrivateProof(body.dataUrl);
    const fileName = v.text(
      String(body.fileName || "proof").replace(/[^\w .()-]/g, "_"),
      { field: "File name", max: 120 }
    ) || "proof";

    const payment = await paymentsRepo.addPayment({
      accessToken: req.accessToken,
      userId: req.user.id,
      fileName,
      preparedFile,
      competitionSlug,
    });
    res.status(201).json({ success: true, item: payment });
  }
);

router.get("/payments/mine", requireAuth, async (req, res) => {
  res.json({ items: await paymentsRepo.listPaymentsForUser(req.user.id, req.accessToken) });
});

// The file itself: only the person who uploaded it, or an admin.
router.get("/payments/:id/file", requireAuth, async (req, res) => {
  const payment = await paymentsRepo.getPaymentWithFile(req.params.id, req.accessToken);
  if (!payment) throw new HttpError(404, "File not found.");

  const file = await paymentsRepo.downloadPaymentFile(payment.storagePath, req.accessToken);
  res.setHeader("Content-Type", payment.fileType);
  res.setHeader("Content-Disposition", `inline; filename="${payment.fileName.replace(/"/g, "")}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(file);
});

// =============================================================================
// ADMIN  (everything below requires an administrator – checked on the server)
// =============================================================================
const admin = Router();
admin.use(requireAdmin);

admin.get("/counts", async (req, res) => {
  res.json({ ...(await systemRepo.adminCounts(req.accessToken)), uploadsBytes: uploadsSizeBytes() });
});

// ---- Image uploads ----------------------------------------------------------
admin.post("/uploads", rateLimit({ windowMs: HOUR, max: 200, key: (req) => `up:${req.user.id}` }), async (req, res) => {
  const image = preparePublicImage(req.body?.dataUrl);
  const uploaded = await mediaRepo.uploadPublicImage(image, req.accessToken);
  res.status(201).json({ url: uploaded.url });
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

async function cleanupImages(paths, accessToken) {
  for (const p of paths) {
    if (p && !(await eventsRepo.isEventImageReferenced(p, accessToken)) && !(await newsRepo.isNewsImageReferenced(p, accessToken))) deletePublicImage(p);
  }
}

admin.post("/competitions", async (req, res) => {
  const data = cleanCompetition(req.body || {});
  const existing = await eventsRepo.competitionSlugs(req.accessToken);
  let slug = slugify(data.name);
  for (let n = 2; existing.includes(slug); n += 1) slug = `${slugify(data.name)}-${n}`;
  const item = await eventsRepo.saveCompetition({ ...data, id: slug, slug }, { create: true, accessToken: req.accessToken });
  res.status(201).json({ item });
});

admin.put("/competitions/:id", async (req, res) => {
  const current = await eventsRepo.getCompetition(req.params.id, req.accessToken);
  if (!current) throw new HttpError(404, "Competition not found.");
  const item = await eventsRepo.saveCompetition({ ...cleanCompetition(req.body || {}), id: current.id, slug: current.slug }, { create: false, accessToken: req.accessToken });
  await cleanupImages([current.image], req.accessToken);
  res.json({ item });
});

admin.delete("/competitions/:id", async (req, res) => {
  const current = await eventsRepo.getCompetition(req.params.id, req.accessToken);
  if (!current) throw new HttpError(404, "Competition not found.");
  await eventsRepo.deleteCompetition(current.slug, req.accessToken);
  await cleanupImages([current.image], req.accessToken);
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
  const id = String(value || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    throw new HttpError(404, "Not found.");
  return id;
};

admin.post("/events", async (req, res) => {
  res.status(201).json({ item: await eventsRepo.saveEvent(cleanEvent(req.body || {}), { create: true, accessToken: req.accessToken }) });
});

admin.put("/events/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const current = await eventsRepo.getEvent(id, req.accessToken);
  if (!current) throw new HttpError(404, "Event not found.");
  const item = await eventsRepo.saveEvent({ ...cleanEvent(req.body || {}), id }, { create: false, accessToken: req.accessToken });
  await cleanupImages([current.image, current.qrCodeImage], req.accessToken);
  res.json({ item });
});

admin.delete("/events/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const current = await eventsRepo.getEvent(id, req.accessToken);
  if (!current) throw new HttpError(404, "Event not found.");
  await eventsRepo.deleteEvent(id, req.accessToken);
  await cleanupImages([current.image, current.qrCodeImage], req.accessToken);
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
  res.status(201).json({ item: await newsRepo.saveNews(cleanNews(req.body || {}), { create: true, accessToken: req.accessToken }) });
});

admin.put("/news/:id", async (req, res) => {
  const id = req.params.id;
  const current = await newsRepo.getNews(id, req.accessToken);
  if (!current) throw new HttpError(404, "Post not found.");
  const item = await newsRepo.saveNews({ ...cleanNews(req.body || {}), id }, { create: false, accessToken: req.accessToken });
  await cleanupImages([current.image], req.accessToken);
  res.json({ item });
});

admin.delete("/news/:id", async (req, res) => {
  const id = req.params.id;
  const current = await newsRepo.getNews(id, req.accessToken);
  if (!current) throw new HttpError(404, "Post not found.");
  await newsRepo.deleteNews(id, req.accessToken);
  await cleanupImages([current.image], req.accessToken);
  res.json({ success: true });
});

// ---- Messages ---------------------------------------------------------------
admin.get("/messages", async (req, res) => res.json({ items: await contactMessagesRepo.listMessages(req.accessToken) }));

admin.post("/messages/read-all", async (req, res) => {
  await contactMessagesRepo.markAllMessagesRead(req.accessToken);
  res.json({ success: true });
});

admin.patch("/messages/:id", async (req, res) => {
  const status = v.oneOf(req.body?.status, ["new", "read"], "Status");
  const item = await contactMessagesRepo.setMessageStatus(req.params.id, status, req.accessToken);
  if (!item) throw new HttpError(404, "Message not found.");
  res.json({ item });
});

admin.delete("/messages/:id", async (req, res) => {
  if (!(await contactMessagesRepo.deleteMessage(req.params.id, req.accessToken))) throw new HttpError(404, "Message not found.");
  res.json({ success: true });
});

// ---- Payments ---------------------------------------------------------------
admin.get("/payments", async (req, res) => res.json({ items: await paymentsRepo.listPayments(req.accessToken) }));

admin.patch("/payments/:id", async (req, res) => {
  const status = v.oneOf(req.body?.status, ["Submitted for review", "Approved", "Rejected"], "Status");
  const item = await paymentsRepo.setPaymentStatus(req.params.id, status, req.accessToken);
  if (!item) throw new HttpError(404, "Submission not found.");
  res.json({ item });
});

admin.delete("/payments/:id", async (req, res) => {
  if (!(await paymentsRepo.deletePayment(req.params.id, req.accessToken))) {
    throw new HttpError(404, "Submission not found.");
  }
  res.json({ success: true });
});

// ---- Users ------------------------------------------------------------------
const ROLES = ["athlete", "guardian", "admin"];

function cleanUser(body, { creating = false } = {}) {
  const user = {
    firstName: v.text(body.firstName, { field: "First name", max: 60, required: true }),
    lastName: v.text(body.lastName, { field: "Last name", max: 60, required: true }),
    email: v.email(body.email),
    phone: v.text(body.phone, { field: "Phone", max: 40 }),
    role: v.oneOf(body.role, ROLES, "Role"),
  };
  const password = String(body.password || "");
  if (creating || password) user.password = v.password(password);
  return user;
}

admin.get("/users", async (req, res) => {
  res.json({ items: await adminUsersRepo.listUsers(req.accessToken) });
});

admin.post("/users", async (req, res) => {
  const item = await adminUsersRepo.createUser(cleanUser(req.body || {}, { creating: true }));
  res.status(201).json({ item });
});

admin.put("/users/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const currentUsers = await adminUsersRepo.listUsers(req.accessToken);
  const current = currentUsers.find((user) => user.id === id);
  if (!current) throw new HttpError(404, "User not found.");

  const changes = cleanUser(req.body || {});
  if (id === req.user.id && changes.role !== "admin") throw new HttpError(400, "You can't change your own administrator role.");
  if (current.role === "admin" && changes.role !== "admin" && currentUsers.filter((user) => user.role === "admin").length <= 1) {
    throw new HttpError(400, "The last administrator can't be demoted.");
  }

  res.json({ item: await adminUsersRepo.updateUser(id, changes) });
});

admin.delete("/users/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const current = (await adminUsersRepo.listUsers(req.accessToken)).find((user) => user.id === id);
  if (!current) throw new HttpError(404, "User not found.");
  if (id === req.user.id) throw new HttpError(400, "You can't delete your own account.");
  if (current.role === "admin") throw new HttpError(400, "Administrators can't be deleted.");

  await adminUsersRepo.deleteUser(id);
  res.json({ success: true });
});

router.use("/admin", admin);

export default router;
