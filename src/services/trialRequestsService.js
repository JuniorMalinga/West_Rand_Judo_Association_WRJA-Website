import { supabase } from "../lib/supabaseClient";

// Normalize user-selected payment method string into lowercase DB check value
function normalizePaymentMethod(method) {
  if (!method) return "cash";
  const lower = method.toLowerCase();
  if (lower.includes("eft")) return "eft";
  if (lower.includes("card")) return "card";
  return "cash";
}

// Convert DB payment method to friendly display text
function formatPaymentMethod(method) {
  if (method === "eft") return "EFT";
  if (method === "card") return "Card";
  if (method === "cash") return "Cash at the dojo";
  return method || "—";
}

// Convert DB status to capitalized display label
function formatStatus(status) {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Map database row into shape used by AdminBookingsPanel
function mapTrialRequest(row) {
  if (!row) return null;

  const instructorsList = (row.programs?.program_instructors || [])
    .map((pi) =>
      [pi.instructor?.first_name, pi.instructor?.last_name]
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean);

  return {
    id: row.id,
    programId: row.program_id,
    programName: row.programs?.name || "Selected Program",
    requesterProfileId: row.requester_profile_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    paymentMethod: formatPaymentMethod(row.payment_method),
    rawPaymentMethod: row.payment_method,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time ? row.preferred_time.slice(0, 5) : "",
    notes: row.notes || "",
    status: row.trial_request_status,
    displayStatus: formatStatus(row.trial_request_status),
    instructor: instructorsList.length > 0 ? instructorsList.join(", ") : "—",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Submit a new trial session booking request to Supabase
export async function createTrialRequest(requestData) {
  const payload = {
    program_id: requestData.programId,
    requester_profile_id: requestData.requesterProfileId || null,
    full_name: requestData.fullName,
    email: requestData.email,
    phone: requestData.phone,
    payment_method: normalizePaymentMethod(requestData.paymentMethod),
    preferred_date: requestData.preferredDate,
    preferred_time: requestData.preferredTime,
    notes: requestData.notes || null,
    trial_request_status: "pending",
  };

  const { data, error } = await supabase
    .from("trial_requests")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch all trial requests for AdminBookingsPanel with program and instructor relationships
export async function getTrialRequestsForAdmin() {
  const { data, error } = await supabase
    .from("trial_requests")
    .select(`
      id,
      program_id,
      requester_profile_id,
      full_name,
      email,
      phone,
      payment_method,
      preferred_date,
      preferred_time,
      notes,
      trial_request_status,
      created_at,
      updated_at,
      programs (
        id,
        name,
        program_instructors (
          instructor:instructors (
            first_name,
            last_name
          )
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapTrialRequest);
}

// Update the status of a trial request in Supabase
export async function updateTrialRequestStatus(id, status) {
  const normalizedStatus = status.toLowerCase();

  const { data, error } = await supabase
    .from("trial_requests")
    .update({ trial_request_status: normalizedStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a trial request by UUID
export async function deleteTrialRequest(id) {
  const { error } = await supabase
    .from("trial_requests")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

