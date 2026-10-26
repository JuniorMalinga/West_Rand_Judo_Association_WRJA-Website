import { createAdminClient } from "../integrations/supabase.js";

function throwIfError(error) {
  if (!error) return;
  const failure = new Error(error.message || "Password recovery database request failed.");
  failure.status = error.status || 503;
  throw failure;
}

const RESET_STATE_KEY = "wrja_password_reset";

export const normalizeResetName = (value) => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
export const normalizeResetPhone = (value) => String(value || "").replace(/\D/g, "");

async function getAuthUser(userId) {
  const { data, error } = await createAdminClient().auth.admin.getUserById(userId);
  throwIfError(error);
  if (!data?.user) throw new Error("Password recovery account could not be loaded.");
  return data.user;
}

export async function getResetState(userId) {
  const user = await getAuthUser(userId);
  return user.app_metadata?.[RESET_STATE_KEY] || null;
}

export async function setResetState(userId, state) {
  const client = createAdminClient();
  const user = await getAuthUser(userId);
  const { error } = await client.auth.admin.updateUserById(userId, {
    app_metadata: { ...(user.app_metadata || {}), [RESET_STATE_KEY]: state },
  });
  throwIfError(error);
}

export async function clearResetState(userId) {
  const client = createAdminClient();
  const user = await getAuthUser(userId);
  if (!user.app_metadata?.[RESET_STATE_KEY]) return;
  const appMetadata = { ...(user.app_metadata || {}) };
  delete appMetadata[RESET_STATE_KEY];
  const { error } = await client.auth.admin.updateUserById(userId, { app_metadata: appMetadata });
  throwIfError(error);
}

export async function findMatchingProfile({ fullName, email, phone }) {
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("id, first_name, last_name, email, phone, is_active")
    .eq("email", email)
    .maybeSingle();
  throwIfError(error);
  if (!data?.is_active) return null;

  const storedName = normalizeResetName(`${data.first_name || ""} ${data.last_name || ""}`);
  if (storedName !== normalizeResetName(fullName)) return null;
  if (phone && normalizeResetPhone(data.phone) !== normalizeResetPhone(phone)) return null;
  return { id: data.id, name: `${data.first_name} ${data.last_name}`.trim() };
}

export async function findActiveProfileByEmail(email) {
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  throwIfError(error);
  return data || null;
}
