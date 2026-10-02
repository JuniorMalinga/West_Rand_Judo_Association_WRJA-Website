import { createAdminClient } from "./supabase.js";
import { createUserClient } from "./supabase.js";

const PROFILE_FIELDS = "id, first_name, last_name, email, phone, profile_role, is_active";

function throwIfError(error) {
  if (!error) return;
  const failure = new Error(error.message || "Supabase user management failed.");
  failure.status = error.status || 500;
  throw failure;
}

function toUser(authUser, profile) {
  const metadata = authUser.user_metadata || {};
  return {
    id: authUser.id,
    firstName: profile?.first_name || metadata.first_name || "",
    lastName: profile?.last_name || metadata.last_name || "",
    email: profile?.email || authUser.email || "",
    phone: profile?.phone || metadata.phone || "",
    dateOfBirth: metadata.date_of_birth || "",
    role: profile?.profile_role === "administrator" ? "admin" : (profile?.profile_role || "athlete"),
    isActive: profile?.is_active ?? false,
    createdAt: authUser.created_at,
  };
}

export async function listUsers(accessToken) {
  const result = await createUserClient(accessToken)
    .from("profiles")
    .select(PROFILE_FIELDS)
    .order("first_name", { ascending: true });
  throwIfError(result.error);
  return (result.data || []).map((profile) => ({
    id: profile.id,
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    dateOfBirth: "",
    role: profile.profile_role === "administrator" ? "admin" : profile.profile_role,
    isActive: profile.is_active,
  })).sort((a, b) => Number(b.role === "admin") - Number(a.role === "admin") || a.firstName.localeCompare(b.firstName));
}

export async function createUser({ firstName, lastName, email, phone, password, role }) {
  const client = createAdminClient();
  const profileRole = role === "admin" ? "administrator" : role;
  const created = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, phone, profile_role: profileRole },
  });
  throwIfError(created.error);

  const profile = await client.from("profiles").upsert({
    id: created.data.user.id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    profile_role: profileRole,
    is_active: true,
  }, { onConflict: "id" });
  if (profile.error) {
    await client.auth.admin.deleteUser(created.data.user.id);
    throwIfError(profile.error);
  }

  return toUser(created.data.user, {
    first_name: firstName, last_name: lastName, email, phone,
    profile_role: profileRole, is_active: true,
  });
}

export async function updateUser(id, { firstName, lastName, email, phone, password, role }) {
  const client = createAdminClient();
  const profileRole = role === "admin" ? "administrator" : role;
  const authUpdate = {
    email,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, phone, profile_role: profileRole },
  };
  if (password) authUpdate.password = password;

  const updated = await client.auth.admin.updateUserById(id, authUpdate);
  throwIfError(updated.error);
  const profile = await client.from("profiles").upsert({
    id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    profile_role: profileRole,
  }, { onConflict: "id" });
  throwIfError(profile.error);

  const result = await client.from("profiles").select(PROFILE_FIELDS).eq("id", id).single();
  throwIfError(result.error);
  return toUser(updated.data.user, result.data);
}

export async function deleteUser(id) {
  const result = await createAdminClient().auth.admin.deleteUser(id);
  throwIfError(result.error);
}