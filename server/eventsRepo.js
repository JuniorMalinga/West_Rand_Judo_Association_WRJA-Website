// Supabase repository for WRJA events and competition views.
// Both APIs use public.events as the shared database source of truth.
import crypto from "crypto";
import { createPublicClient, createUserClient } from "./supabase.js";
import { publicMediaUrl, storagePathFromPublicUrl } from "./mediaRepo.js";

const eventSelect = `
  id, title, slug, event_type, description, event_date, location,
  registration_deadline, event_status, entry_form_path, image_path,
  registration_type, registration_url, registration_status_label,
  payment_required, payment_instructions, payment_url, additional_info,
  display_order, qr_code_image_path
`;

const check = (error) => {
  if (error) throw new Error(`Supabase events query failed: ${error.message}`);
};

const toCompetition = (row, client) => row && ({
  id: row.slug,
  slug: row.slug,
  name: row.title,
  type: row.event_type,
  description: row.description || "",
  date: row.event_date,
  location: row.location || "",
  registrationDeadline: row.registration_deadline || "",
  registrationStatus: row.registration_status_label || "Registration link pending",
  registrationType: row.registration_type || "external",
  registrationUrl: row.registration_url || "",
  paymentRequired: Boolean(row.payment_required),
  paymentInstructions: row.payment_instructions || "",
  paymentUrl: row.payment_url || "",
  image: row.image_path ? publicMediaUrl(row.image_path, client) : "/uploads/public/default-competition.jpg",
  additionalInfo: row.additional_info || "",
  displayOrder: row.display_order ?? 99,
});

const displayType = (value) => ({
  competition: "Competition",
  grading: "Grading",
  training_camp: "Training camp",
}[value] || value || "Event");

const databaseType = (value) => {
  const normalized = String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");
  if (["competition", "grading", "training_camp"].includes(normalized)) return normalized;
  throw new Error("Event type must be Competition, Grading or Training camp.");
};

const toEvent = (row, client) => row && ({
  id: row.id,
  name: row.title,
  type: displayType(row.event_type),
  date: row.event_date,
  location: row.location || "",
  description: row.description || "",
  image: row.image_path ? publicMediaUrl(row.image_path, client) : "/uploads/public/default-event.jpg",
  applicationSheetUrl: row.entry_form_path || "",
  qrCodeImage: row.qr_code_image_path ? publicMediaUrl(row.qr_code_image_path, client) : "",
});

export async function listCompetitions(accessToken = null) {
  const client = accessToken ? createUserClient(accessToken) : createPublicClient();
  const { data, error } = await client.from("events").select(eventSelect)
    .eq("event_type", "competition").order("display_order").order("title");
  check(error);
  return (data || []).map((row) => toCompetition(row, client));
}

export async function getCompetition(slug, accessToken = null) {
  const client = accessToken ? createUserClient(accessToken) : createPublicClient();
  const { data, error } = await client.from("events").select(eventSelect)
    .eq("event_type", "competition").eq("slug", slug).maybeSingle();
  check(error);
  return toCompetition(data, client);
}

export async function competitionSlugs(accessToken) {
  const { data, error } = await createUserClient(accessToken).from("events")
    .select("slug").eq("event_type", "competition");
  check(error);
  return (data || []).map((row) => row.slug);
}

export async function saveCompetition(c, { create, accessToken }) {
  const client = createUserClient(accessToken);
  const values = {
    title: c.name,
    slug: c.slug,
    event_type: "competition",
    description: c.description || null,
    event_date: c.date,
    location: c.location || null,
    registration_deadline: c.registrationDeadline || null,
    registration_status_label: c.registrationStatus || null,
    registration_type: c.registrationType || null,
    registration_url: c.registrationUrl || null,
    payment_required: Boolean(c.paymentRequired),
    payment_instructions: c.paymentInstructions || null,
    payment_url: c.paymentUrl || null,
    image_path: storagePathFromPublicUrl(c.image, client) || c.image || null,
    additional_info: c.additionalInfo || null,
    display_order: c.displayOrder ?? 99,
    event_status: "published",
    updated_at: new Date().toISOString(),
  };
  const query = create
    ? client.from("events").insert(values).select(eventSelect).single()
    : client.from("events").update(values).eq("slug", c.slug).eq("event_type", "competition").select(eventSelect).maybeSingle();
  const { data, error } = await query;
  check(error);
  return toCompetition(data, client);
}

export async function deleteCompetition(slug, accessToken) {
  const { error, count } = await createUserClient(accessToken).from("events")
    .delete({ count: "exact" }).eq("slug", slug).eq("event_type", "competition");
  check(error);
  return (count || 0) > 0;
}

export async function listEvents(accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client.from("events")
    .select(eventSelect).order("event_date").order("title");
  check(error);
  return (data || []).map((row) => toEvent(row, client));
}

export async function getEvent(id, accessToken) {
  const client = createUserClient(accessToken);
  const { data, error } = await client.from("events")
    .select(eventSelect).eq("id", id).maybeSingle();
  check(error);
  return toEvent(data, client);
}

export async function saveEvent(event, { create, accessToken }) {
  const client = createUserClient(accessToken);
  const values = {
    title: event.name,
    event_type: databaseType(event.type),
    description: event.description || null,
    event_date: event.date,
    location: event.location || null,
    image_path: storagePathFromPublicUrl(event.image, client) || event.image || null,
    entry_form_path: event.applicationSheetUrl || null,
    qr_code_image_path: storagePathFromPublicUrl(event.qrCodeImage, client) || event.qrCodeImage || null,
    event_status: "published",
    updated_at: new Date().toISOString(),
  };
  if (create) {
    values.slug = `${String(event.name).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "event"}-${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await client.from("events").insert(values).select(eventSelect).single();
    check(error);
    return toEvent(data, client);
  }
  const { data, error } = await client.from("events").update(values)
    .eq("id", event.id).select(eventSelect).maybeSingle();
  check(error);
  return toEvent(data, client);
}

export async function deleteEvent(id, accessToken) {
  const { error, count } = await createUserClient(accessToken).from("events")
    .delete({ count: "exact" }).eq("id", id);
  check(error);
  return (count || 0) > 0;
}

export async function isEventImageReferenced(path, accessToken) {
  if (!path) return false;
  const client = createUserClient(accessToken);
  const [image, qr] = await Promise.all([
    client.from("events").select("id", { count: "exact", head: true }).eq("image_path", path),
    client.from("events").select("id", { count: "exact", head: true }).eq("qr_code_image_path", path),
  ]);
  check(image.error); check(qr.error);
  return (image.count || 0) + (qr.count || 0) > 0;
}
