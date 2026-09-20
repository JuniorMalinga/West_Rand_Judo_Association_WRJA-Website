import { supabase } from "../lib/supabaseClient";

// Convert database snake_case columns into React camelCase properties
function mapProfile(row) {
  if (!row) return null;

  return {
    id: row.id,
    role: row.profile_role,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Get the currently active session from Supabase
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Fetch the user's profile row from public.profiles
export async function getProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, profile_role, first_name, last_name, phone, is_active, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return mapProfile(data);
}

// Log in an existing user with email and password
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Register a new user with Supabase Auth.
// Frontend role is strictly restricted to athlete or guardian so public signups can never be administrators.
export async function signUpWithEmail(userDetails) {
  const safeRole = userDetails.role === "guardian" ? "guardian" : "athlete";

  const { data, error } = await supabase.auth.signUp({
    email: userDetails.email,
    password: userDetails.password,
    options: {
      data: {
        first_name: userDetails.firstName,
        last_name: userDetails.lastName,
        phone: userDetails.phone || null,
        profile_role: safeRole,
        date_of_birth: userDetails.dateOfBirth || null,
      },
    },
  });

  if (error) throw error;
  return data;
}

// Log out the currently authenticated user
export async function signOutCurrentUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Subscribe to Supabase auth state changes (login, logout, token refresh)
export function subscribeToAuthChanges(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}

