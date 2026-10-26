import { Router } from "express";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import * as eventsRepo from "../database/eventsRepo.js";
import * as newsRepo from "../database/newsRepo.js";
import * as contactMessagesRepo from "../database/contactMessagesRepo.js";
import * as mailer from "../integrations/mailer.js";
import * as paymentsRepo from "../database/paymentsRepo.js";
import * as systemRepo from "../database/systemRepo.js";
import * as mediaRepo from "../database/mediaRepo.js";
import * as galleryRepo from "../database/galleryRepo.js";
import * as adminUsersRepo from "../database/adminUsersRepo.js";
import * as passwordResetRepo from "../database/passwordResetRepo.js";
import {
  PASSWORD_RESET_OTP_TTL_MS,
  PASSWORD_RESET_OTP_TTL_SECONDS,
  PASSWORD_RESET_RESEND_WINDOW_MS,
  passwordResetResendDelayMs,
} from "../passwordResetPolicy.js";
import * as v from "../validate.js";
import { cleanGalleryItem } from "../galleryValidation.js";
import { authClient, clearSession, loadProfile, setSession, revokeSession, requireAdmin, requireAuth } from "../auth.js";
import { createAdminClient, createUserClient } from "../integrations/supabase.js";
import { canReadPaymentFile } from "../access.js";
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
const loginAttemptsByIp = createLimiter({ windowMs: 15 * MINUTE, max: 20 });
const loginFailuresByEmail = createLimiter({ windowMs: 15 * MINUTE, max: 5 });
const passwordResetRequestsByIp = createLimiter({ windowMs: HOUR, max: 20 });
const passwordResetVerificationsByIp = createLimiter({ windowMs: HOUR, max: 20 });
const passwordResetVerificationsByEmail = createLimiter({ windowMs: HOUR, max: 10 });
const passwordResetPasswordChecksByIp = createLimiter({ windowMs: HOUR, max: 10 });
const passwordResetPasswordChecksByEmail = createLimiter({ windowMs: HOUR, max: 5 });

export function buildPasswordResetRequest(body = {}) {
  const phone = v.text(body.phone, { field: "Phone", max: 40 });
  const phoneDigits = phone.replace(/\D/g, "");
  if (phone && (!/^[+()\d\s.-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15)) {
    throw new HttpError(400, "Enter a valid phone number, or leave the phone field blank.");
  }

  return {
    fullName: v.text(body.fullName ?? body.name, { field: "Full name", max: 120, required: true }).replace(/\s+/g, " "),
    email: v.email(body.email),
    phone,
  };
}

export function buildPasswordResetCode(value) {
  const code = v.text(value, { field: "Reset code", max: 12, min: 6, required: true });
  if (!/^\d{6,12}$/.test(code)) {
    throw new HttpError(400, "Enter the numeric code from your email.");
  }
  return code;
}

function requestIp(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function formatCooldown(seconds) {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function passwordResetCodeDigest(userId, code) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new HttpError(503, "Password reset is not available right now. Please try again later.");
  // Auth app metadata is visible in user claims, so short OTPs need a server-keyed digest.
  return createHmac("sha256", secret).update(`${userId}:${code}`).digest("hex");
}

function checkRateLimit(res, limiters, keys, message) {
  const wait = Math.max(...limiters.map((limiter, index) => limiter.blocked(keys[index])));
  if (wait) {
    res.setHeader("Retry-After", String(wait));
    throw new HttpError(429, message);
  }
  limiters.forEach((limiter, index) => limiter.hit(keys[index]));
}

router.post("/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 254);
  const password = String(req.body?.password || "").slice(0, 256);
  if (!email || !password) throw new HttpError(400, "Please enter your email and password.");

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const emailKey = createHash("sha256").update(email).digest("hex");
  const wait = Math.max(loginAttemptsByIp.blocked(ip), loginFailuresByEmail.blocked(emailKey));
  if (wait) {
    res.setHeader("Retry-After", String(wait));
    throw new HttpError(429, `Too many login attempts. Please try again in ${Math.ceil(wait / 60)} minute(s).`);
  }
  loginAttemptsByIp.hit(ip);

  const client = authClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    loginFailuresByEmail.hit(emailKey);
    throw new HttpError(401, "Invalid email or password.");
  }
  // Never trust a role supplied by the browser or user metadata.
  const profile = await loadProfile(createUserClient(data.session.access_token), data.user);
  loginFailuresByEmail.reset(emailKey);
  setSession(req, res, data.session);
  res.json({ success: true, user: publicUser(profile) });
});

router.post("/auth/password-reset-request", async (req, res) => {
  const { fullName, email, phone } = buildPasswordResetRequest(req.body || {});
  checkRateLimit(
    res,
    [passwordResetRequestsByIp],
    [requestIp(req)],
    "Too many password reset requests. Please try again later.",
  );

  const account = await passwordResetRepo.findActiveProfileByEmail(email);
  if (!account) {
    throw new HttpError(404, "No WRJA account exists with that email address. Please create an account first.");
  }
  const profile = await passwordResetRepo.findMatchingProfile({ fullName, email, phone });
  if (!profile) {
    throw new HttpError(400, "The name or phone number does not match that account.");
  }

  const now = Date.now();
  const currentState = await passwordResetRepo.getResetState(account.id);
  const lastSentAt = Date.parse(currentState?.lastSentAt || "");
  const resendSequenceActive = Number.isFinite(lastSentAt) && now - lastSentAt < PASSWORD_RESET_RESEND_WINDOW_MS;
  const nextResendAt = resendSequenceActive ? Date.parse(currentState?.nextResendAt || "") : NaN;
  if (Number.isFinite(nextResendAt) && nextResendAt > now) {
    const waitSeconds = Math.ceil((nextResendAt - now) / 1000);
    res.setHeader("Retry-After", String(waitSeconds));
    return res.status(429).json({
      success: false,
      error: `Please wait ${formatCooldown(waitSeconds)} before requesting another reset code.`,
      retryAfterSeconds: waitSeconds,
    });
  }
  if (!mailer.isPasswordResetEmailConfigured()) {
    throw new HttpError(503, "Password reset email is not available right now. Please try again later.");
  }

  const sendCount = resendSequenceActive ? Math.max(0, Number(currentState?.sendCount) || 0) + 1 : 1;
  try {
    const { data, error } = await createAdminClient().auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (error) throw error;
    const code = data?.properties?.email_otp;
    if (!code || !/^\d{6,12}$/.test(code)) {
      throw new Error("Supabase did not provide a supported recovery code.");
    }

    const expiresAt = new Date(now + PASSWORD_RESET_OTP_TTL_MS);
    const nextSendAt = new Date(now + passwordResetResendDelayMs(sendCount));
    await passwordResetRepo.setResetState(account.id, {
      codeHash: passwordResetCodeDigest(account.id, code),
      expiresAt: expiresAt.toISOString(),
      nextResendAt: nextSendAt.toISOString(),
      lastSentAt: new Date(now).toISOString(),
      sendCount,
      attempts: 0,
    });
    await mailer.sendPasswordResetCode({
      email,
      name: profile.name,
      code,
      expiresAt: expiresAt.toISOString(),
    });
    res.status(202).json({
      success: true,
      message: "Your password reset code has been sent.",
      expiresAt: expiresAt.toISOString(),
      nextResendAt: nextSendAt.toISOString(),
      expiresInSeconds: PASSWORD_RESET_OTP_TTL_SECONDS,
      resendAfterSeconds: Math.ceil(passwordResetResendDelayMs(sendCount) / 1000),
    });
  } catch (error) {
    console.error("Password reset code generation or delivery failed.", error.code || error.responseCode || "unknown");
    throw new HttpError(503, "Unable to send a reset code right now. Please try again later.");
  }
});

router.post("/auth/password-reset-verify", async (req, res) => {
  const email = v.email(req.body?.email);
  const code = buildPasswordResetCode(req.body?.code);

  checkRateLimit(
    res,
    [passwordResetVerificationsByIp, passwordResetVerificationsByEmail],
    [requestIp(req), createHash("sha256").update(email).digest("hex")],
    "Too many code attempts. Please try again later.",
  );

  const profile = await passwordResetRepo.findActiveProfileByEmail(email);
  if (!profile) throw new HttpError(400, "That code is invalid or expired. Request a new code and try again.");
  const resetState = await passwordResetRepo.getResetState(profile.id);
  if (!resetState?.codeHash) {
    throw new HttpError(400, "That code is invalid or expired. Request a new code and try again.");
  }
  if ((Number(resetState.attempts) || 0) >= 5) {
    throw new HttpError(429, "Too many incorrect code attempts. Request a new code when the resend timer allows.");
  }
  const expiresAt = Date.parse(resetState.expiresAt || "");
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await passwordResetRepo.setResetState(profile.id, { ...resetState, codeHash: null });
    throw new HttpError(400, "That code has expired. Request a new one when the resend timer allows.");
  }

  const submittedDigest = Buffer.from(passwordResetCodeDigest(profile.id, code), "hex");
  const expectedDigest = Buffer.from(resetState.codeHash || "", "hex");
  if (expectedDigest.length !== submittedDigest.length || !timingSafeEqual(expectedDigest, submittedDigest)) {
    const attempts = (Number(resetState.attempts) || 0) + 1;
    await passwordResetRepo.setResetState(profile.id, {
      ...resetState,
      codeHash: attempts >= 5 ? null : resetState.codeHash,
      attempts,
    });
    if (attempts >= 5) {
      throw new HttpError(429, "Too many incorrect code attempts. Request a new code when the resend timer allows.");
    }
    throw new HttpError(400, "That code is incorrect or expired. Check the code and try again.");
  }

  const { data, error } = await authClient().auth.verifyOtp({
    email,
    token: code,
    type: "recovery",
  });
  if (error || !data.user || data.user.id !== profile.id || !data.session) {
    await passwordResetRepo.setResetState(profile.id, { ...resetState, codeHash: null });
    throw new HttpError(400, "That code is invalid or expired. Request a new code when the resend timer allows.");
  }
  try {
    await passwordResetRepo.setResetState(profile.id, { ...resetState, codeHash: null, attempts: 0 });
  } catch (stateError) {
    console.error("Unable to invalidate verified password reset code.", stateError.message);
  }
  res.json({ success: true, resetToken: data.session.access_token });
});

router.post("/auth/password-reset-complete", async (req, res) => {
  const email = v.email(req.body?.email);
  const resetToken = v.text(req.body?.resetToken, { field: "Reset verification", max: 4096, required: true });
  const newPassword = v.password(req.body?.newPassword);
  const { data, error } = await authClient().auth.getUser(resetToken);
  if (error || !data.user || data.user.email?.toLowerCase() !== email) {
    throw new HttpError(400, "Your reset verification has expired. Request a new code.");
  }
  const profile = await passwordResetRepo.findActiveProfileByEmail(email);
  if (!profile || profile.id !== data.user.id) {
    throw new HttpError(400, "Your reset verification has expired. Request a new code.");
  }
  const emailKey = createHash("sha256").update(email).digest("hex");
  checkRateLimit(
    res,
    [passwordResetPasswordChecksByIp, passwordResetPasswordChecksByEmail],
    [requestIp(req), emailKey],
    "Too many password reset attempts. Please try again later.",
  );
  const passwordCheck = await authClient().auth.signInWithPassword({ email, password: newPassword });
  if (passwordCheck.data?.session) {
    const { error: revokeCheckError } = await createAdminClient().auth.admin.signOut(
      passwordCheck.data.session.access_token,
      "local",
    );
    if (revokeCheckError) {
      console.error("Unable to revoke password reuse check session.", revokeCheckError.message);
    }
    throw new HttpError(400, "Your new password must be different from your current password.");
  }
  if (passwordCheck.error?.code !== "invalid_credentials") {
    console.error("Password reuse check failed.", passwordCheck.error?.code || passwordCheck.error?.status || "unknown");
    throw new HttpError(503, "Unable to validate your new password right now. Please try again.");
  }
  await adminUsersRepo.resetPassword(profile.id, newPassword);
  try {
    await passwordResetRepo.clearResetState(profile.id);
  } catch (clearError) {
    console.error("Unable to clear completed password reset state.", clearError.message);
  }
  const { error: revokeError } = await createAdminClient().auth.admin.signOut(resetToken, "global");
  if (revokeError) {
    console.error("Unable to revoke sessions after password reset.", revokeError.message);
  }
  res.json({ success: true });
});

router.post("/auth/signup", rateLimit({ windowMs: HOUR, max: 10, message: "Too many sign-ups from this connection. Please try again later." }), async (req, res) => {
  const body = req.body || {};
  const role = v.oneOf(body.role || "athlete", ["athlete", "guardian"], "Account type"); // never 'admin'
  const dateOfBirth = role === "athlete" ? v.isoDate(body.dateOfBirth, { field: "Date of birth", required: true }) : "";
  if (role === "athlete" && v.calculateAge(dateOfBirth) < 18) {
    throw new HttpError(400, 'Athletes under 18 need a parent or guardian to create the account instead.');
  }

  const data = {
    firstName: v.personName(body.firstName, "First name"),
    lastName: v.personName(body.lastName, "Last name"),
    email: v.email(body.email),
    phone: v.text(body.phone, { field: "Phone", max: 40 }),
    dateOfBirth,
    role,
  };
  const password = v.password(body.password);
  let user;
  try {
    user = await adminUsersRepo.createUser({ ...data, password });
  } catch (error) {
    if (/already registered|already exists|duplicate key/i.test(error.message || "")) {
      throw new HttpError(409, "An account with that email address already exists.");
    }
    throw error;
  }

  let emailSent = false;
  try {
    await mailer.sendSignupNotification({
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
    });
    emailSent = true;
  } catch (emailError) {
    console.error("Signup notification email failed.", emailError.code || emailError.responseCode || "unknown");
  }

  res.status(201).json({
    success: true,
    user: { ...data, id: user.id },
    emailSent,
    message: emailSent
      ? "Account created successfully. You can now sign in."
      : "Account created successfully, but we couldn't send the notification email. You can still sign in.",
  });
});

router.post("/auth/logout", async (req, res) => {
  if (req.accessToken && req.refreshToken) {
    try {
      await revokeSession(req.accessToken, req.refreshToken);
    } catch (error) {
      console.warn("Supabase session revocation failed.", error.code || error.status || "unknown");
    }
  }
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
router.get("/schools", async (req, res) => {
  const items = await eventsRepo.listSchools(req.accessToken);
  res.json({ items: items.map((school) => serializeCompetition(school, Boolean(req.user))) });
});

router.get("/schools", async (req, res) => {
  const items = await eventsRepo.listSchools(req.accessToken);
  res.json({ items: items.map((school) => serializeCompetition(school, Boolean(req.user))) });
});

router.get("/events", requireAuth, async (req, res) => {
  res.json({ items: await eventsRepo.listEvents(req.accessToken) });
});

router.get("/news", async (req, res) => {
  res.json({ items: await newsRepo.listNews(req.accessToken) });
});

// =============================================================================
// MEMBER PROFILE
// =============================================================================
router.post("/profile/change-password", requireAuth, rateLimit({
  windowMs: HOUR,
  max: 5,
  key: (req) => `profile-password:${req.user.id}`,
}), async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || "");
  if (!currentPassword || currentPassword.length > 256) {
    throw new HttpError(400, "Enter your current password.");
  }
  const newPassword = v.password(req.body?.newPassword);
  if (newPassword === currentPassword) {
    throw new HttpError(400, "Choose a password different from your current password.");
  }

  const { data, error } = await authClient().auth.signInWithPassword({
    email: req.user.email,
    password: currentPassword,
  });
  if (error || !data.session) throw new HttpError(401, "Your current password is incorrect.");

  const userClient = createUserClient(data.session.access_token);
  const { error: sessionError } = await userClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  if (sessionError) throw new HttpError(401, "Unable to verify your account session. Please sign in again.");

  const { error: updateError } = await userClient.auth.updateUser({ password: newPassword });
  if (updateError) throw new HttpError(400, updateError.message || "Unable to change your password.");
  res.json({ success: true });
});

router.post(
  "/profile/deletion-request",
  requireAuth,
  rateLimit({ windowMs: HOUR, max: 3, key: (req) => `profile-deletion:${req.user.id}` }),
  async (req, res) => {
    await contactMessagesRepo.addMessage({
      name: `${req.user.firstName} ${req.user.lastName}`.trim(),
      email: req.user.email,
      message: "The signed-in member requests WRJA to review and process deletion of their website account. Please verify the request with the member before taking action.",
      source: "Account deletion request",
    }, req.accessToken, req.user.id);
    res.status(201).json({ success: true });
  }
);

router.get("/gallery", async (req, res) => {
  res.json({ items: await galleryRepo.listGallery(req.accessToken) });
});

router.get("/gallery/deleted-paths", async (_req, res) => {
  res.json({ items: await galleryRepo.listDeletedGalleryPaths() });
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

    // The message is saved. A failed confirmation email must never fail the request.
    let confirmationEmailSent = false;
    try {
      const sent = await mailer.sendContactConfirmation(message);
      confirmationEmailSent = Boolean(sent);
      if (!sent) console.warn("Confirmation email skipped: SMTP settings are missing.");
    } catch (error) {
      console.warn("Confirmation email failed.", error.code || error.responseCode || "unknown");
    }

    return res.status(201).json({ success: true, confirmationEmailSent });
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
  if (!canReadPaymentFile(payment, req.user)) throw new HttpError(404, "File not found.");
  if (!["application/pdf", "image/jpeg", "image/png"].includes(payment.fileType)) {
    throw new HttpError(404, "File not found.");
  }

  const file = await paymentsRepo.downloadPaymentFile(payment.storagePath);
  res.setHeader("Content-Type", payment.fileType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  const safeFileName = String(payment.fileName || "proof").slice(0, 120).replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
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
  const uploaded = await mediaRepo.uploadPublicImage(image);
  res.status(201).json({ url: uploaded.url });
});

// ---- Competitions -----------------------------------------------------------
const REGISTRATION_STATUSES = [
  "Registration Open", "Registration Not Yet Open", "Registration Closing Soon",
  "Registration Closed", "Event Completed", "Registration link pending",
];
const REGISTRATION_TYPES = ["external", "internal", "order"];

function cleanManagedImage(value, accessToken, field = "Image") {
  const image = v.text(value, { field, max: 2048 });
  if (!image || image.startsWith("/uploads/public/")) return v.uploadedImage(image, field);

  if (/^https?:\/\//i.test(image)) {
    const storagePath = mediaRepo.storagePathFromPublicUrl(image, createUserClient(accessToken));
    if (mediaRepo.isManagedAdminImagePath(storagePath)) return image;
  }

  return v.uploadedImage(image, field);
}

export function cleanCompetition(body, accessToken) {
  const paymentRequired = Boolean(body.paymentRequired);
  return {
    name: v.text(body.name, { field: "Name", max: 120, required: true }),
    type: v.text(body.type, { field: "Type", max: 60, required: true }),
    description: v.text(body.description, { field: "Description", max: 2000, required: true }),
    date: v.isoDate(body.date, { field: "Date", required: true }),
    location: v.text(body.location, { field: "Location", max: 160, required: true }),
    registrationDeadline: v.isoDate(body.registrationDeadline, { field: "Registration deadline" }),
    registrationStatus: v.oneOf(body.registrationStatus || "Registration link pending", REGISTRATION_STATUSES, "Status"),
    registrationType: v.oneOf(body.registrationType || "external", REGISTRATION_TYPES, "Registration type"),
    registrationUrl: v.httpUrl(body.registrationUrl, "Registration URL"),
    paymentRequired,
    paymentInstructions: paymentRequired ? v.text(body.paymentInstructions, { field: "Payment instructions", max: 2000 }) : "",
    paymentUrl: paymentRequired ? v.httpUrl(body.paymentUrl, "Payment URL") : "",
    image: cleanManagedImage(body.image, accessToken) || "/uploads/public/default-competition.jpeg",
    additionalInfo: v.text(body.additionalInfo, { field: "Additional information", max: 2000 }),
    displayOrder: v.integer(body.displayOrder, { field: "Display order", min: 1, max: 9999, fallback: 99 }),
  };
}

const slugify = (value) =>
  String(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "competition";

// Removes old images from Storage once nothing uses them. A cleanup problem
// must never fail the request, because the main change has already been saved.
async function cleanupImages(paths, accessToken) {
  for (const p of paths) {
    if (!p) continue;
    try {
      const stillUsed =
        (await eventsRepo.isEventImageReferenced(p, accessToken)) ||
        (await newsRepo.isNewsImageReferenced(p, accessToken)) ||
        (await galleryRepo.isGalleryImageReferenced(p, accessToken));
      if (!stillUsed) await mediaRepo.deletePublicMedia(p);
    } catch (error) {
      console.warn("Image cleanup skipped:", error.message);
    }
  }
}

admin.post("/competitions", async (req, res) => {
  const data = cleanCompetition(req.body || {}, req.accessToken);
  const existing = await eventsRepo.competitionSlugs(req.accessToken);
  const baseSlug = slugify(data.name);
  const reservedSafeSlug = eventsRepo.isSchoolSlug(baseSlug) ? `competition-${baseSlug}` : baseSlug;
  let slug = reservedSafeSlug;
  for (let n = 2; existing.includes(slug); n += 1) slug = `${reservedSafeSlug}-${n}`;
  const item = await eventsRepo.saveCompetition({ ...data, id: slug, slug }, { create: true, accessToken: req.accessToken });
  res.status(201).json({ item });
});

admin.put("/competitions/:id", async (req, res) => {
  if (eventsRepo.isSchoolSlug(req.params.id)) throw new HttpError(404, "Competition not found.");
  const current = await eventsRepo.getCompetition(req.params.id, req.accessToken);
  if (!current) throw new HttpError(404, "Competition not found.");
  const item = await eventsRepo.saveCompetition({ ...cleanCompetition(req.body || {}, req.accessToken), id: current.id, slug: current.slug }, { create: false, accessToken: req.accessToken });
  await cleanupImages([current.image], req.accessToken);
  res.json({ item });
});

admin.delete("/competitions/:id", async (req, res) => {
  if (eventsRepo.isSchoolSlug(req.params.id)) throw new HttpError(404, "Competition not found.");
  const current = await eventsRepo.getCompetition(req.params.id, req.accessToken);
  if (!current) throw new HttpError(404, "Competition not found.");
  await eventsRepo.deleteCompetition(current.slug, req.accessToken);
  await cleanupImages([current.image], req.accessToken);
  res.json({ success: true });
});
export function cleanSchool(body = {}, accessToken) {
  return {
    ...cleanCompetition({
      ...body,
      type: "Schools competition",
      image: body.image || "/uploads/public/default-school.jpeg",
    }, accessToken),
    type: "Schools competition",
  };
}
admin.post("/schools", async (req, res) => {
  const data = cleanSchool(req.body || {}, req.accessToken);
  const existing = await eventsRepo.competitionSlugs(req.accessToken);
  const nameSlug = slugify(data.name).replace(/^sa-schools(?:-|$)/, "") || "event";
  let slug = `sa-schools-${nameSlug}`;
  for (let suffix = 2; existing.includes(slug); suffix += 1) slug = `sa-schools-${nameSlug}-${suffix}`;
  const item = await eventsRepo.saveSchool({ ...data, id: slug, slug }, { create: true, accessToken: req.accessToken });
  res.status(201).json({ item });
});
admin.put("/schools/:id", async (req, res) => {
  const current = await eventsRepo.getSchool(req.params.id, req.accessToken);
  if (!current) throw new HttpError(404, "School event not found.");
  const item = await eventsRepo.saveSchool({ ...cleanSchool(req.body || {}, req.accessToken), id: current.id, slug: current.slug }, {
    create: false,
    accessToken: req.accessToken,
  });
  await cleanupImages([current.image], req.accessToken);
  res.json({ item });
});
admin.delete("/schools/:id", async (req, res) => {
  const current = await eventsRepo.getSchool(req.params.id, req.accessToken);
  if (!current) throw new HttpError(404, "School event not found.");
  await eventsRepo.deleteSchool(current.slug, req.accessToken);
  await cleanupImages([current.image], req.accessToken);
  res.json({ success: true });
});

// ---- Events -----------------------------------------------------------------
export function cleanEvent(body) {
  const applicationSheetUrl = v.httpUrl(body.applicationSheetUrl, "Google Sheets link");
  if (!applicationSheetUrl) throw new HttpError(400, "A Google Sheets application link is required.");
  const sheetUrl = new URL(applicationSheetUrl);
  if (sheetUrl.hostname !== "docs.google.com" || !sheetUrl.pathname.startsWith("/spreadsheets/")) {
    throw new HttpError(400, "Application link must be a Google Sheets spreadsheet URL.");
  }

  const imageReference = (value, field) => {
    const clean = v.text(value, { field, max: 2048 });
    if (!clean) return "";
    return /^https?:\/\//i.test(clean) ? v.httpUrl(clean, field) : v.uploadedImage(clean, field);
  };
  const qrCodeImage = imageReference(body.qrCodeImage, "QR code image");

  return {
    name: v.text(body.name, { field: "Event name", max: 140, required: true }),
    type: v.oneOf(v.text(body.type, { field: "Type", max: 60, required: true }), ["Grading", "Training camp"], "Type"),
    date: v.isoDate(body.date, { required: true }),
    location: v.text(body.location, { field: "Location", max: 160, required: true }),
    description: v.text(body.description, { field: "Description", max: 3000 }),
    image: imageReference(body.image, "Event image") || "/uploads/public/default-event.jpeg",
    applicationSheetUrl,
    qrCodeImage,
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

function cleanNewsImage(value, accessToken) {
  const image = v.text(value, { field: "Image", max: 2048 });
  if (!image || image === "/src/assets/images/Logo/wrja-logo.png") return "";
  return cleanManagedImage(image, accessToken);
}

function cleanNews(body, accessToken) {
  const sortDate = v.isoDate(body.sortDate, { field: "Date", required: true });
  return {
    title: v.text(body.title, { field: "Title", max: 200, required: true }),
    sortDate,
    date: formatNewsDate(sortDate),
    category: v.text(body.category, { field: "Category", max: 60, required: true }),
    excerpt: v.text(body.excerpt, { field: "Summary", max: 1500, required: true }),
    body: v.text(body.body, { field: "Full story", max: 20000 }),
    image: cleanNewsImage(body.image, accessToken) || "/uploads/public/default-news.jpeg",
    source: v.text(body.source, { field: "Source", max: 120 }),
    url: v.httpUrl(body.url, "Source URL"),
  };
}

admin.post("/news", async (req, res) => {
  res.status(201).json({ item: await newsRepo.saveNews(cleanNews(req.body || {}, req.accessToken), { create: true, accessToken: req.accessToken }) });
});

admin.put("/news/:id", async (req, res) => {
  const id = req.params.id;
  const current = await newsRepo.getNews(id, req.accessToken);
  if (!current) throw new HttpError(404, "Post not found.");
  const item = await newsRepo.saveNews({ ...cleanNews(req.body || {}, req.accessToken), id }, { create: false, accessToken: req.accessToken });
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

// ---- Gallery ----------------------------------------------------------------
admin.get("/gallery", async (req, res) => {
  res.json({ items: await galleryRepo.listGallery(req.accessToken) });
});

admin.post("/gallery", async (req, res) => {
  const item = await galleryRepo.saveGalleryItem(cleanGalleryItem(req.body || {}), {
    create: true,
    accessToken: req.accessToken,
  });
  res.status(201).json({ item });
});

admin.put("/gallery/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const current = await galleryRepo.getGalleryItem(id, req.accessToken);
  if (!current) throw new HttpError(404, "Gallery image not found.");
  const item = await galleryRepo.saveGalleryItem({ ...cleanGalleryItem(req.body || {}), id }, {
    create: false,
    accessToken: req.accessToken,
  });
  if (galleryRepo.isManagedGalleryUploadPath(current.imagePath) && current.imagePath !== item.imagePath) {
    await cleanupImages([current.photoUrl], req.accessToken);
  }
  res.json({ item });
});

admin.delete("/gallery/:id", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!galleryRepo.isGalleryItemId(id)) throw new HttpError(400, "Gallery image ID is invalid.");
  try {
    const current = await galleryRepo.getGalleryItem(id, req.accessToken);
    if (!current) throw new HttpError(404, "Gallery image not found.");

    const [eventReference, newsReference, galleryReference] = await Promise.all([
      eventsRepo.isEventImageReferenced(current.imagePath, req.accessToken),
      newsRepo.isNewsImageReferenced(current.imagePath, req.accessToken),
      galleryRepo.isGalleryImageReferenced(current.imagePath, req.accessToken, id),
    ]);
    if (eventReference || newsReference || galleryReference) {
      throw new HttpError(409, "This image is also used by another record. Update that record before deleting the image.");
    }

    const result = await galleryRepo.deleteGalleryItem(id, current, { accessToken: req.accessToken });
    if (!result.deleted) throw new HttpError(404, "Gallery image not found.");
    res.json({ success: true, orderUpdated: result.orderUpdated });
  } catch (error) {
    if (error instanceof HttpError && error.status < 500) throw error;
    console.error("Gallery permanent deletion failed.", { galleryId: id, code: error.code || error.status });
    res.status(500).json({ success: false, error: "The image could not be completely deleted. Check the gallery and Storage before retrying." });
  }
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
    firstName: v.personName(body.firstName, "First name"),
    lastName: v.personName(body.lastName, "Last name"),
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
