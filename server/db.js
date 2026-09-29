// Local SQL database (SQLite) for the WRJA site.
//
// Uses Node's built-in `node:sqlite` (Node 22.5+) and falls back to
// `better-sqlite3` if that's what's installed. Everything else in the server
// talks to the database through repo.js only, so moving to Supabase later
// means replacing repo.js and nothing else.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = process.env.WRJA_DATA_DIR || path.join(__dirname, "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const PUBLIC_UPLOADS = path.join(UPLOAD_DIR, "public");
export const PRIVATE_UPLOADS = path.join(UPLOAD_DIR, "private");

fs.mkdirSync(PUBLIC_UPLOADS, { recursive: true });
fs.mkdirSync(PRIVATE_UPLOADS, { recursive: true });

async function openDatabase(file) {
  // node:sqlite prints an "experimental" warning on load – filter just that one.
  const originalEmit = process.emitWarning;
  process.emitWarning = (warning, ...rest) => {
    if (String(warning).includes("SQLite")) return undefined;
    return originalEmit.call(process, warning, ...rest);
  };

  try {
    const { DatabaseSync } = await import("node:sqlite");
    return new DatabaseSync(file);
  } catch {
    // fall through to better-sqlite3
  } finally {
    process.emitWarning = originalEmit;
  }

  try {
    const { default: BetterSqlite3 } = await import("better-sqlite3");
    return new BetterSqlite3(file);
  } catch {
    throw new Error(
      "No SQLite driver available. Use Node 22.13 or newer (built-in), or run `npm install` in /server to install better-sqlite3."
    );
  }
}

export const DB_FILE = process.env.WRJA_DB_PATH || path.join(DATA_DIR, "wrja.db");
export const db = await openDatabase(DB_FILE);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

// Minimal transaction helper (works for both drivers).
export function transaction(work) {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
