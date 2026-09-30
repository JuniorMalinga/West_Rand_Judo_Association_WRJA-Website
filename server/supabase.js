// Shared Supabase connection for server routes. No service-role key is used here.
// Pass the signed-in user’s access token so PostgreSQL RLS checks that user.
import { createClient } from "@supabase/supabase-js";


export function createPublicClient() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  if (!url || !anonKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.local.");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createUserClient(accessToken) {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  if (!url || !anonKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.local.");
  }
  if (!accessToken) {
    throw new Error("A Supabase access token is required for user-scoped requests.");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
