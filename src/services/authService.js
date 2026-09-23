import { supabase } from "../lib/supabaseClient";

/**
 * Maps public.profiles database fields to the React profile shape.
 * Exposes only camelCase properties without duplicating snake_case fields.
 */
export function mapProfile(dbProfile) {
  if (!dbProfile) return null;
  return {
    id: dbProfile.id,
    role: dbProfile.profile_role,
    firstName: dbProfile.first_name,
    lastName: dbProfile.last_name,
    phone: dbProfile.phone,
    email: dbProfile.email,
    isActive: dbProfile.is_active,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

/**
 * Fetches the public.profiles record for a given auth user UUID.
 */
export async function getProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error.message || error);
    throw error;
  }

  return mapProfile(data);
}

/**
 * Authenticates user via Supabase Auth and fetches associated profile.
 */
export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw error;
  }

  if (!data?.user) {
    throw new Error("No user returned from authentication.");
  }

  const profile = await getProfile(data.user.id);

  return {
    user: data.user,
    session: data.session,
    profile,
  };
}

/**
 * Registers a new user via Supabase Auth with metadata matching the Kotlin implementation.
 * Database triggers create the corresponding profile and role business records.
 */
export async function signUpWithEmail(userDetails) {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    dateOfBirth,
    termsAccepted,
  } = userDetails;

  if (!termsAccepted) {
    throw new Error("Terms and privacy policy must be accepted.");
  }

  if (!["athlete", "guardian"].includes(role)) {
    throw new Error("Invalid public signup role.");
  }

  const safeRole = role;

  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  const normalizedPhone = phone && phone.trim() ? phone.trim() : null;
  const normalizedDob = safeRole === "athlete" && dateOfBirth ? dateOfBirth : null;
  const isTermsAccepted = true;

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        first_name: firstName ? firstName.trim() : "",
        last_name: lastName ? lastName.trim() : "",
        phone: normalizedPhone,
        profile_role: safeRole,
        terms_accepted: isTermsAccepted,
        date_of_birth: normalizedDob,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Signs out the current user via Supabase Auth.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out from Supabase:", error.message || error);
    throw error;
  }
}

/**
 * Retrieves the current Supabase session.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error retrieving Supabase session:", error.message || error);
    return null;
  }
  return data?.session ?? null;
}

/**
 * Subscribes to Supabase auth state changes.
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
