import { authClient } from "./auth.js";
import { createUserClient } from "./supabase.js";

const selectFields = "id, requester_profile_id, full_name, phone, email, message, created_at, source, status";

const mapMessage = (row) => ({
  id: row.id,
  requesterProfileId: row.requester_profile_id || null,
  name: row.full_name,
  phone: row.phone || "",
  email: row.email,
  message: row.message,
  createdAt: row.created_at,
  source: row.source || "Contact page",
  status: row.status || "new",
});

function check(error) {
  if (error) throw new Error(error.message || "Contact message database request failed.");
}

export async function addMessage(message, accessToken = null, requesterProfileId = null) {
  // Public visitors use the anon client. Signed-in users use their own JWT so RLS
  // can verify requester_profile_id instead of trusting an ID sent by the browser.
  const client = accessToken ? createUserClient(accessToken) : authClient();
  const payload = {
    requester_profile_id: accessToken ? requesterProfileId : null,
    full_name: message.name,
    phone: message.phone || null,
    email: message.email,
    message: message.message,
    source: message.source || "Contact page",
    status: "new",
  };

  const { error } = await client.from("contact_messages").insert(payload);
  check(error);
}

export async function listMessages(accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client
    .from("contact_messages")
    .select(selectFields)
    .order("created_at", { ascending: false });
  check(error);
  return (data || []).map(mapMessage);
}

export async function markAllMessagesRead(accessToken) {
  const client = createUserClient(accessToken);
  const { error } = await client
    .from("contact_messages")
    .update({ status: "read" })
    .eq("status", "new");
  check(error);
}

export async function setMessageStatus(id, status, accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client
    .from("contact_messages")
    .update({ status })
    .eq("id", id)
    .select(selectFields)
    .maybeSingle();
  check(error);
  return data ? mapMessage(data) : null;
}

export async function deleteMessage(id, accessToken) {
  const client = createUserClient(accessToken);

  // Check first because Supabase DELETE can succeed with zero visible rows.
  const { data: current, error: findError } = await client
    .from("contact_messages")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  check(findError);
  if (!current) return false;

  const { error } = await client.from("contact_messages").delete().eq("id", id);
  check(error);
  return true;
}
