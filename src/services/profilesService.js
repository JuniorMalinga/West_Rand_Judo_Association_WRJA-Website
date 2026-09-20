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

// Fetch all profiles for the admin panel.
// Supabase Row Level Security (RLS) policies determine whether the logged-in user can read all profiles.
export async function getProfilesForAdmin() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, profile_role, first_name, last_name, phone, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapProfile);
}

