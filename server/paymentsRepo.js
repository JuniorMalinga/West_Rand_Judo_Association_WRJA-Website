import { randomUUID } from "crypto";
import { createUserClient } from "./supabase.js";

const BUCKET = "payment-proofs";
const proofFields = "id, uploaded_by_profile_id, event_id, event_registration_id, payment_for, file_name, file_size, file_type, storage_path, review_status, uploaded_at, reviewed_at";

const statusToUi = {
  submitted: "Submitted for review",
  approved: "Approved",
  rejected: "Rejected",
};

const statusToDb = {
  "Submitted for review": "submitted",
  Approved: "approved",
  Rejected: "rejected",
};

function check(error, message = "Payment proof request failed.") {
  if (error) throw new Error(`${message} ${error.message || ""}`.trim());
}

function extensionFor(type) {
  if (type === "application/pdf") return "pdf";
  if (type === "image/png") return "png";
  return "jpg";
}

async function relatedData(client, rows) {
  const profileIds = [...new Set(rows.map((row) => row.uploaded_by_profile_id).filter(Boolean))];
  const eventIds = [...new Set(rows.map((row) => row.event_id).filter(Boolean))];

  const profiles = new Map();
  const events = new Map();

  if (profileIds.length) {
    const { data, error } = await client.from("profiles")
      .select("id, first_name, last_name, email").in("id", profileIds);
    check(error);
    for (const row of data || []) profiles.set(row.id, row);
  }

  if (eventIds.length) {
    const { data, error } = await client.from("events")
      .select("id, slug, title").in("id", eventIds);
    check(error);
    for (const row of data || []) events.set(row.id, row);
  }

  return { profiles, events };
}

function mapPayment(row, related) {
  const profile = related.profiles.get(row.uploaded_by_profile_id);
  const event = related.events.get(row.event_id);
  return {
    id: row.id,
    userId: row.uploaded_by_profile_id,
    userName: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "",
    userEmail: profile?.email || "",
    competitionSlug: event?.slug || "",
    competitionName: event?.title || row.payment_for || "Other / not listed",
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    status: statusToUi[row.review_status] || "Submitted for review",
    uploadedAt: row.uploaded_at,
    reviewedAt: row.reviewed_at,
  };
}

async function mapRows(client, rows) {
  const related = await relatedData(client, rows);
  return rows.map((row) => mapPayment(row, related));
}

export async function addPayment({ accessToken, userId, fileName, preparedFile, competitionSlug }) {
  const client = createUserClient(accessToken);
  let eventId = null;
  let paymentFor = "Other / not listed";

  if (competitionSlug) {
    const { data: event, error } = await client.from("events")
      .select("id, title, slug")
      .eq("event_type", "competition")
      .eq("slug", competitionSlug)
      .maybeSingle();
    check(error);
    if (!event) throw new Error("That competition doesn't exist.");
    eventId = event.id;
    paymentFor = event.title;
  }

  const storagePath = `${userId}/${randomUUID()}.${extensionFor(preparedFile.type)}`;

  const { error: uploadError } = await client.storage.from(BUCKET)
    .upload(storagePath, preparedFile.buffer, {
      contentType: preparedFile.type,
      upsert: false,
      cacheControl: "0",
    });
  check(uploadError, "Payment proof upload failed.");

  const values = {
    uploaded_by_profile_id: userId,
    event_id: eventId,
    payment_for: paymentFor,
    file_name: fileName,
    file_size: preparedFile.size,
    file_type: preparedFile.type,
    storage_path: storagePath,
    review_status: "submitted",
  };

  const { data, error } = await client.from("payment_proofs")
    .insert(values).select(proofFields).single();

  if (error) {
    // Avoid leaving a private object behind when the metadata insert fails.
    await client.storage.from(BUCKET).remove([storagePath]);
    check(error);
  }

  const [mapped] = await mapRows(client, [data]);
  return mapped;
}

export async function listPayments(accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client.from("payment_proofs")
    .select(proofFields).order("uploaded_at", { ascending: false });
  check(error);
  return mapRows(client, data || []);
}

export async function listPaymentsForUser(userId, accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client.from("payment_proofs")
    .select(proofFields)
    .eq("uploaded_by_profile_id", userId)
    .order("uploaded_at", { ascending: false });
  check(error);
  return mapRows(client, data || []);
}

export async function getPaymentWithFile(id, accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client.from("payment_proofs")
    .select(proofFields).eq("id", id).maybeSingle();
  check(error);
  if (!data) return null;
  const [mapped] = await mapRows(client, [data]);
  return { ...mapped, storagePath: data.storage_path };
}

export async function downloadPaymentFile(storagePath, accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client.storage.from(BUCKET).download(storagePath);
  check(error, "Payment proof download failed.");
  return Buffer.from(await data.arrayBuffer());
}

export async function setPaymentStatus(id, status, accessToken) {
  const dbStatus = statusToDb[status];
  if (!dbStatus) throw new Error("Invalid payment status.");

  const client = createUserClient(accessToken);
  const { data, error } = await client.from("payment_proofs")
    .update({
      review_status: dbStatus,
      reviewed_at: dbStatus === "submitted" ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .select(proofFields)
    .maybeSingle();
  check(error);
  if (!data) return null;
  const [mapped] = await mapRows(client, [data]);
  return mapped;
}

export async function deletePayment(id, accessToken) {
  const client = createUserClient(accessToken);
  const { data, error: findError } = await client.from("payment_proofs")
    .select("id, storage_path").eq("id", id).maybeSingle();
  check(findError);
  if (!data) return false;

  const { error: deleteError } = await client.from("payment_proofs").delete().eq("id", id);
  check(deleteError);

  // Metadata is already removed. If Storage cleanup fails, the object remains
  // private and can be cleaned later without exposing a database record.
  const { error: storageError } = await client.storage.from(BUCKET).remove([data.storage_path]);
  if (storageError) console.warn("Payment proof storage cleanup failed:", storageError.message);
  return true;
}

export async function paymentCounts(accessToken) {
  const client = createUserClient(accessToken);
  const [all, pending] = await Promise.all([
    client.from("payment_proofs").select("id", { count: "exact", head: true }),
    client.from("payment_proofs").select("id", { count: "exact", head: true }).eq("review_status", "submitted"),
  ]);
  check(all.error); check(pending.error);
  return { payments: all.count || 0, pendingPayments: pending.count || 0 };
}
