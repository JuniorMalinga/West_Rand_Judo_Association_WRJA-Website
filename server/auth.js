// Authentication: password hashing, server-side sessions and access guards.

import crypto from "crypto";
import { promisify } from "util";
import * as repo from "./repo.js";
import { HttpError } from "./security.js";

const scrypt = promisify(crypto.scrypt);

const COOKIE_NAME = "wrja_session";
const MEMBER_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000; // administrators re-authenticate daily

// ---- Passwords --------------------------------------------------------------
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// A throwaway hash so "unknown email" takes as long as "wrong password"
// (prevents telling whether an account exists by response time).
export const DUMMY_HASH = await hashPassword(crypto.randomBytes(12).toString("hex"));

// ---- Cookies ----------------------------------------------------------------
function parseCookies(header = "") {
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      // ignore malformed cookie values
    }
  }
  return cookies;
}

function cookieHeader(value, maxAgeSeconds, req) {
  const secure = req.secure || process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// ---- Sessions ---------------------------------------------------------------
export async function startSession(req, res, user) {
  const token = crypto.randomBytes(32).toString("base64url");
  const lifetime = user.role === "admin" ? ADMIN_SESSION_MS : MEMBER_SESSION_MS;
  await repo.createSession({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + lifetime).toISOString(),
    ip: req.ip,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
  });
  res.setHeader("Set-Cookie", cookieHeader(token, Math.floor(lifetime / 1000), req));
}

export async function endSession(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (token) await repo.deleteSession(hashToken(token));
  res.setHeader("Set-Cookie", cookieHeader("", 0, req));
}

export function currentSessionHash(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  return token ? hashToken(token) : null;
}

// Runs on every request: turns the cookie into req.user (or null).
// The role is read from the database each time, so demoting or deleting a user
// takes effect immediately.
export async function attachUser(req, res, next) {
  req.user = null;
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return next();

  const session = await repo.getSession(hashToken(token));
  if (!session) return next();

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await repo.deleteSession(session.tokenHash);
    return next();
  }

  req.user = session.user;
  req.sessionHash = session.tokenHash;
  return next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return next(new HttpError(401, "Please log in to continue."));
  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return next(new HttpError(401, "Please log in to continue."));
  if (req.user.role !== "admin") return next(new HttpError(403, "You don't have permission to do that."));
  return next();
}
