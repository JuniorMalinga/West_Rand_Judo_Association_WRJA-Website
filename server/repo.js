// Data access layer – the ONLY file that contains SQL.
//
// Every function is async and returns plain camelCase objects, so a Supabase
// version of this file can be dropped in later without touching any route.
// All queries use bound parameters (never string concatenation).

import { randomUUID } from "crypto";
import { db, transaction } from "./db.js";

const now = () => new Date().toISOString();
const one = (sql, ...params) => db.prepare(sql).get(...params) || null;
const all = (sql, ...params) => db.prepare(sql).all(...params);
const run = (sql, ...params) => db.prepare(sql).run(...params);

// ---- Row mappers ------------------------------------------------------------
const toUser = (r) => r && ({
  id: r.id, firstName: r.first_name, lastName: r.last_name, email: r.email,
  phone: r.phone || "", dateOfBirth: r.date_of_birth || "", role: r.role, createdAt: r.created_at,
});

const toCompetition = (r) => r && ({
  id: r.id, slug: r.slug, name: r.name, type: r.type, description: r.description,
  date: r.date, location: r.location, registrationDeadline: r.registration_deadline,
  registrationStatus: r.registration_status, registrationType: r.registration_type,
  registrationUrl: r.registration_url, paymentRequired: Boolean(r.payment_required),
  paymentInstructions: r.payment_instructions, paymentUrl: r.payment_url,
  image: r.image, additionalInfo: r.additional_info, displayOrder: r.display_order,
});

const toEvent = (r) => r && ({
  id: r.id, name: r.name, type: r.type, date: r.date, location: r.location,
  description: r.description, image: r.image,
  applicationSheetUrl: r.application_sheet_url, qrCodeImage: r.qr_code_image,
});

const toNews = (r) => r && ({
  id: r.id, title: r.title, date: r.date_label, sortDate: r.sort_date, category: r.category,
  excerpt: r.excerpt, body: r.body, image: r.image, source: r.source, url: r.url,
  hasVideo: Boolean(r.has_video), likes: r.likes, views: r.views, comments: r.comments,
});

const toMessage = (r) => r && ({
  id: r.id, name: r.name, email: r.email, phone: r.phone, message: r.message,
  source: r.source, status: r.status, createdAt: r.created_at,
});

const toPayment = (r) => r && ({
  id: r.id, userId: r.user_id, userName: r.user_name, userEmail: r.user_email,
  competitionSlug: r.competition_slug, competitionName: r.competition_name,
  fileName: r.file_name, fileSize: r.file_size, fileType: r.file_type,
  status: r.status, uploadedAt: r.uploaded_at, reviewedAt: r.reviewed_at,
});

// ---- Users ------------------------------------------------------------------
export async function findUserByEmail(email) {
  const row = one("SELECT * FROM users WHERE email = ?", email);
  return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
}
export async function findUserById(id) {
  const row = one("SELECT * FROM users WHERE id = ?", id);
  return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
}
export async function listUsers() {
  return all("SELECT * FROM users ORDER BY role = 'admin' DESC, first_name COLLATE NOCASE").map(toUser);
}
export async function createUser({ firstName, lastName, email, phone = "", dateOfBirth = "", role, passwordHash }) {
  const id = `user-${randomUUID()}`;
  const stamp = now();
  run(
    `INSERT INTO users (id, first_name, last_name, email, phone, date_of_birth, role, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, firstName, lastName, email, phone, dateOfBirth, role, passwordHash, stamp, stamp
  );
  return toUser(one("SELECT * FROM users WHERE id = ?", id));
}
export async function updateUser(id, { firstName, lastName, email, phone, role, passwordHash }) {
  const current = one("SELECT * FROM users WHERE id = ?", id);
  if (!current) return null;
  run(
    `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?, password_hash = ?, updated_at = ? WHERE id = ?`,
    firstName ?? current.first_name, lastName ?? current.last_name, email ?? current.email,
    phone ?? current.phone, role ?? current.role, passwordHash ?? current.password_hash, now(), id
  );
  return toUser(one("SELECT * FROM users WHERE id = ?", id));
}
export async function deleteUser(id) {
  return run("DELETE FROM users WHERE id = ?", id).changes > 0;
}
export async function countAdmins() {
  return one("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").n;
}

// ---- Sessions ---------------------------------------------------------------
export async function createSession({ tokenHash, userId, expiresAt, ip, userAgent }) {
  const stamp = now();
  run(
    `INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    tokenHash, userId, stamp, stamp, expiresAt, ip || "", userAgent || ""
  );
}
export async function getSession(tokenHash) {
  const row = one(
    `SELECT s.token_hash, s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    tokenHash
  );
  return row ? { tokenHash: row.token_hash, expiresAt: row.expires_at, user: toUser(row) } : null;
}
export async function deleteSession(tokenHash) {
  run("DELETE FROM sessions WHERE token_hash = ?", tokenHash);
}
export async function deleteUserSessions(userId, exceptTokenHash = null) {
  run("DELETE FROM sessions WHERE user_id = ? AND token_hash IS NOT ?", userId, exceptTokenHash);
}
export async function purgeExpiredSessions() {
  run("DELETE FROM sessions WHERE expires_at <= ?", now());
}

// ---- Competitions -----------------------------------------------------------
export async function listCompetitions() {
  return all("SELECT * FROM competitions ORDER BY display_order, name").map(toCompetition);
}
export async function getCompetition(id) {
  return toCompetition(one("SELECT * FROM competitions WHERE id = ?", id));
}
export async function competitionSlugs() {
  return all("SELECT slug FROM competitions").map((r) => r.slug);
}
export async function saveCompetition(c, { create }) {
  const stamp = now();
  if (create) {
    run(
      `INSERT INTO competitions (id, slug, name, type, description, date, location, registration_deadline, registration_status,
        registration_type, registration_url, payment_required, payment_instructions, payment_url, image, additional_info, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      c.id, c.slug, c.name, c.type, c.description, c.date, c.location, c.registrationDeadline, c.registrationStatus,
      c.registrationType, c.registrationUrl, c.paymentRequired ? 1 : 0, c.paymentInstructions, c.paymentUrl, c.image,
      c.additionalInfo, c.displayOrder, stamp, stamp
    );
  } else {
    const result = run(
      `UPDATE competitions SET name = ?, type = ?, description = ?, date = ?, location = ?, registration_deadline = ?,
        registration_status = ?, registration_type = ?, registration_url = ?, payment_required = ?, payment_instructions = ?,
        payment_url = ?, image = ?, additional_info = ?, display_order = ?, updated_at = ? WHERE id = ?`,
      c.name, c.type, c.description, c.date, c.location, c.registrationDeadline, c.registrationStatus, c.registrationType,
      c.registrationUrl, c.paymentRequired ? 1 : 0, c.paymentInstructions, c.paymentUrl, c.image, c.additionalInfo,
      c.displayOrder, stamp, c.id
    );
    if (result.changes === 0) return null;
  }
  return getCompetition(c.id);
}
export async function deleteCompetition(id) {
  return run("DELETE FROM competitions WHERE id = ?", id).changes > 0;
}

// ---- Events -----------------------------------------------------------------
export async function listEvents() {
  return all("SELECT * FROM events ORDER BY date, id").map(toEvent);
}
export async function getEvent(id) {
  return toEvent(one("SELECT * FROM events WHERE id = ?", id));
}
export async function saveEvent(e, { create }) {
  const stamp = now();
  if (create) {
    const result = run(
      `INSERT INTO events (name, type, date, location, description, image, application_sheet_url, qr_code_image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      e.name, e.type, e.date, e.location, e.description, e.image, e.applicationSheetUrl, e.qrCodeImage, stamp, stamp
    );
    return getEvent(Number(result.lastInsertRowid));
  }
  const result = run(
    `UPDATE events SET name = ?, type = ?, date = ?, location = ?, description = ?, image = ?, application_sheet_url = ?,
      qr_code_image = ?, updated_at = ? WHERE id = ?`,
    e.name, e.type, e.date, e.location, e.description, e.image, e.applicationSheetUrl, e.qrCodeImage, stamp, e.id
  );
  return result.changes ? getEvent(e.id) : null;
}
export async function deleteEvent(id) {
  return run("DELETE FROM events WHERE id = ?", id).changes > 0;
}

// ---- News -------------------------------------------------------------------
export async function listNews() {
  return all("SELECT * FROM news ORDER BY sort_date DESC, id DESC").map(toNews);
}
export async function getNews(id) {
  return toNews(one("SELECT * FROM news WHERE id = ?", id));
}
export async function saveNews(n, { create }) {
  const stamp = now();
  if (create) {
    const result = run(
      `INSERT INTO news (title, date_label, sort_date, category, excerpt, body, image, source, url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      n.title, n.date, n.sortDate, n.category, n.excerpt, n.body, n.image, n.source, n.url, stamp, stamp
    );
    return getNews(Number(result.lastInsertRowid));
  }
  const result = run(
    `UPDATE news SET title = ?, date_label = ?, sort_date = ?, category = ?, excerpt = ?, body = ?, image = ?, source = ?,
      url = ?, updated_at = ? WHERE id = ?`,
    n.title, n.date, n.sortDate, n.category, n.excerpt, n.body, n.image, n.source, n.url, stamp, n.id
  );
  return result.changes ? getNews(n.id) : null;
}
export async function deleteNews(id) {
  return run("DELETE FROM news WHERE id = ?", id).changes > 0;
}

// Is an uploaded image still used by any record?
export async function isImageReferenced(urlPath) {
  if (!urlPath) return false;
  return Boolean(
    one(
      `SELECT 1 AS used FROM (
         SELECT image AS p FROM competitions UNION ALL SELECT image FROM events
         UNION ALL SELECT qr_code_image FROM events UNION ALL SELECT image FROM news
       ) WHERE p = ? LIMIT 1`,
      urlPath
    )
  );
}

// ---- Messages ---------------------------------------------------------------
export async function addMessage(m) {
  const id = `msg-${randomUUID()}`;
  run(
    `INSERT INTO messages (id, name, email, phone, message, source, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`,
    id, m.name, m.email, m.phone, m.message, m.source, now()
  );
  return toMessage(one("SELECT * FROM messages WHERE id = ?", id));
}
export async function listMessages() {
  return all("SELECT * FROM messages ORDER BY created_at DESC").map(toMessage);
}
export async function setMessageStatus(id, status) {
  const result = run("UPDATE messages SET status = ? WHERE id = ?", status, id);
  return result.changes ? toMessage(one("SELECT * FROM messages WHERE id = ?", id)) : null;
}
export async function markAllMessagesRead() {
  run("UPDATE messages SET status = 'read' WHERE status = 'new'");
}
export async function deleteMessage(id) {
  return run("DELETE FROM messages WHERE id = ?", id).changes > 0;
}

// ---- Payments (proof of payment) ---------------------------------------------
export async function addPayment(p) {
  const id = `pop-${randomUUID()}`;
  run(
    `INSERT INTO payments (id, user_id, user_name, user_email, competition_slug, competition_name, file_name, file_size,
      file_type, stored_name, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted for review', ?)`,
    id, p.userId, p.userName, p.userEmail, p.competitionSlug, p.competitionName, p.fileName, p.fileSize, p.fileType,
    p.storedName, now()
  );
  return toPayment(one("SELECT * FROM payments WHERE id = ?", id));
}
export async function listPayments() {
  return all("SELECT * FROM payments ORDER BY uploaded_at DESC").map(toPayment);
}
export async function listPaymentsForUser(userId) {
  return all("SELECT * FROM payments WHERE user_id = ? ORDER BY uploaded_at DESC", userId).map(toPayment);
}
// Includes the private stored file name – for the file route only, never sent to clients.
export async function getPaymentWithFile(id) {
  const row = one("SELECT * FROM payments WHERE id = ?", id);
  return row ? { ...toPayment(row), storedName: row.stored_name } : null;
}
export async function setPaymentStatus(id, status) {
  const result = run("UPDATE payments SET status = ?, reviewed_at = ? WHERE id = ?", status, now(), id);
  return result.changes ? toPayment(one("SELECT * FROM payments WHERE id = ?", id)) : null;
}
export async function deletePayment(id) {
  const row = one("SELECT stored_name FROM payments WHERE id = ?", id);
  if (!row) return null;
  run("DELETE FROM payments WHERE id = ?", id);
  return { storedName: row.stored_name };
}

// ---- Dashboard counts -------------------------------------------------------
export async function adminCounts() {
  const today = new Date().toISOString().slice(0, 10);
  const n = (sql, ...p) => one(sql, ...p).n;
  return {
    competitions: n("SELECT COUNT(*) AS n FROM competitions"),
    events: n("SELECT COUNT(*) AS n FROM events"),
    upcomingEvents: n("SELECT COUNT(*) AS n FROM events WHERE date >= ?", today),
    news: n("SELECT COUNT(*) AS n FROM news"),
    users: n("SELECT COUNT(*) AS n FROM users"),
    members: n("SELECT COUNT(*) AS n FROM users WHERE role != 'admin'"),
    messages: n("SELECT COUNT(*) AS n FROM messages"),
    unreadMessages: n("SELECT COUNT(*) AS n FROM messages WHERE status = 'new'"),
    payments: n("SELECT COUNT(*) AS n FROM payments"),
    pendingPayments: n("SELECT COUNT(*) AS n FROM payments WHERE status = 'Submitted for review'"),
  };
}

// ---- Seeding helpers --------------------------------------------------------
export async function tableIsEmpty(table) {
  const allowed = ["users", "competitions", "events", "news"];
  if (!allowed.includes(table)) throw new Error("Unknown table");
  return one(`SELECT COUNT(*) AS n FROM ${table}`).n === 0;
}
export { transaction };
