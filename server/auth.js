// Supabase Auth is the only source of passwords and sessions.
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./security.js";

const ACCESS = "wrja_access";
const REFRESH = "wrja_refresh";
const cookieOptions = (req) => `Path=/; HttpOnly; SameSite=Lax${req.secure || process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

function cookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => {
    const i = part.indexOf("=");
    if (i < 0) return ["", ""];
    try { return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())]; }
    catch { return ["", ""]; }
  }));
}

export function authClient() {
  if (!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) || !(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY))
    throw new Error("Configure SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.local.");
  return createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function setSession(req, res, session) {
  const options = cookieOptions(req);
  res.setHeader("Set-Cookie", [
    `${ACCESS}=${encodeURIComponent(session.access_token)}; ${options}; Max-Age=${Math.max(0, session.expires_in || 3600)}`,
    `${REFRESH}=${encodeURIComponent(session.refresh_token)}; ${options}; Max-Age=604800`,
  ]);
}

export function clearSession(req, res) {
  const options = cookieOptions(req);
  res.setHeader("Set-Cookie", [
    `${ACCESS}=; ${options}; Max-Age=0`,
    `${REFRESH}=; ${options}; Max-Age=0`,
  ]);
}

export async function loadProfile(client, user) {
  const { data, error } = await client.from("profiles")
    .select("id, first_name, last_name, email, phone, profile_role, is_active")
    .eq("id", user.id).maybeSingle();
  if (error) throw new HttpError(503, "Unable to load your WRJA profile.");
  if (!data || !data.is_active) throw new HttpError(403, "Your WRJA profile is unavailable or inactive.");
  return { id: data.id, firstName: data.first_name, lastName: data.last_name,
    email: data.email || user.email, phone: data.phone || "",
    dateOfBirth: null, role: data.profile_role === "administrator" ? "admin" : data.profile_role };
}

export async function attachUser(req, res, next) {
  req.user = null;
  try {
    const stored = cookies(req.headers.cookie);
    let accessToken = stored[ACCESS];
    if (!accessToken && !stored[REFRESH]) return next();
    const client = authClient();
    let { data: { user }, error } = accessToken
      ? await client.auth.getUser(accessToken) : { data: { user: null }, error: true };
    if ((error || !user) && stored[REFRESH]) {
      const refreshed = await client.auth.refreshSession({ refresh_token: stored[REFRESH] });
      if (refreshed.error || !refreshed.data.session) { clearSession(req, res); return next(); }
      setSession(req, res, refreshed.data.session);
      accessToken = refreshed.data.session.access_token;
      user = refreshed.data.user;
    }
    if (!user) { clearSession(req, res); return next(); }
    // User-scoped reads enforce the existing profiles RLS policy.
    const scoped = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    req.user = await loadProfile(scoped, user);
    req.accessToken = accessToken;
    next();
  } catch (error) { next(error); }
}

export function requireAuth(req, res, next) {
  if (!req.user) return next(new HttpError(401, "Please log in to continue."));
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return next(new HttpError(401, "Please log in to continue."));
  if (req.user.role !== "admin") return next(new HttpError(403, "You don't have permission to do that."));
  next();
}
