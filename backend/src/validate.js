// Input validation helpers. Every value that reaches the database goes through
// one of these, so the API never trusts what the browser sends.

import { HttpError } from "./security.js";

export function text(value, { field, max = 200, required = false, min = 0 } = {}) {
  const clean = String(value ?? "").replace(/\u0000/g, "").trim();
  if (required && !clean) throw new HttpError(400, `${field} is required.`);
  if (clean && clean.length < min) throw new HttpError(400, `${field} is too short.`);
  if (clean.length > max) throw new HttpError(400, `${field} is too long (maximum ${max} characters).`);
  return clean;
}

export function email(value) {
  const clean = text(value, { field: "Email", max: 254, required: true }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new HttpError(400, "Please enter a valid email address.");
  return clean;
}

export function password(value) {
  const clean = String(value ?? "");
  if (clean.length < 8) throw new HttpError(400, "Your password must be at least 8 characters.");
  if (clean.length > 128) throw new HttpError(400, "That password is too long.");
  if (!/[A-Za-z]/.test(clean) || !/\d/.test(clean)) {
    throw new HttpError(400, "Your password needs at least one letter and one number.");
  }
  return clean;
}

export function httpUrl(value, field = "Link") {
  const clean = text(value, { field, max: 1000 });
  if (!clean) return "";
  let parsed;
  try {
    parsed = new URL(clean);
  } catch {
    throw new HttpError(400, `${field} must be a valid link starting with http:// or https://`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new HttpError(400, `${field} must start with http:// or https://`);
  }
  return parsed.toString();
}

export function isoDate(value, { field = "Date", required = false } = {}) {
  const clean = text(value, { field, max: 10, required });
  if (!clean) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean) || Number.isNaN(new Date(`${clean}T12:00:00`).getTime())) {
    throw new HttpError(400, `${field} is not a valid date.`);
  }
  return clean;
}

export function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) throw new HttpError(400, `${field} is not valid.`);
  return value;
}

export function integer(value, { field, min = 0, max = 100000, fallback = 0 } = {}) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new HttpError(400, `${field} must be a whole number between ${min} and ${max}.`);
  }
  return number;
}

// Images must be files this server saved itself – never an arbitrary link.
// An empty value means "use the default image".
export function uploadedImage(value, field = "Image") {
  const clean = String(value ?? "").trim();
  if (!clean) return "";
  if (!/^\/uploads\/public\/[A-Za-z0-9._-]+\.(jpe?g|png|webp|gif)$/.test(clean)) {
    throw new HttpError(400, `${field} must be uploaded through the admin uploader.`);
  }
  return clean;
}

export function calculateAge(dateOfBirth) {
  const dob = new Date(`${dateOfBirth}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}
