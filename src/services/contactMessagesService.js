import { supabase } from "../lib/supabaseClient";

// Format ISO timestamp into friendly South African date format
function formatMessageDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Map database snake_case fields into camelCase properties for React components
function mapContactMessage(row) {
  if (!row) return null;

  return {
    id: row.id,
    requesterProfileId: row.requester_profile_id,
    name: row.full_name,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || "",
    message: row.message,
    createdAt: row.created_at,
    date: formatMessageDate(row.created_at),
  };
}

// Submit a new contact message to Supabase
// NOTE: This performs an INSERT ONLY. Public/anonymous users do not have a SELECT policy,
// so chaining .select(), .single(), or .maybeSingle() will violate RLS with error 42501.
export async function createContactMessage(messageData) {
  const payload = {
    requester_profile_id: messageData.requesterProfileId || null,
    full_name: messageData.fullName.trim(),
    phone: messageData.phone ? messageData.phone.trim() : null,
    email: messageData.email.trim(),
    message: messageData.message.trim(),
  };

  const { error } = await supabase
    .from("contact_messages")
    .insert(payload);

  if (error) throw error;
}

// Fetch all contact messages for AdminContactsPanel ordered newest first
export async function getContactMessagesForAdmin() {
  const { data, error } = await supabase
    .from("contact_messages")
    .select(`
      id,
      requester_profile_id,
      full_name,
      phone,
      email,
      message,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapContactMessage);
}

// Delete a contact message by UUID
export async function deleteContactMessage(id) {
  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

