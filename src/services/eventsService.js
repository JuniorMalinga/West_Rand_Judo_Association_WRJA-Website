import { supabase } from "../lib/supabaseClient";
import { getPublicMediaUrl, getEventDocumentUrl } from "./storageService";

// Helper to format database event_type values (e.g., "training_camp" -> "Training Camp")
function formatEventType(value) {
  if (!value) return "Event";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Generate a clean URL-friendly slug from an event title
function generateSlug(title) {
  return (title || "event")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Map database row to summary event shape for the public events listing
function mapEventSummary(row) {
  return {
    id: row.id,
    name: row.title,
    type: formatEventType(row.event_type),
    date: row.event_date,
    location: row.location,
  };
}

// Map database row to full detail shape for public EventDetailPage
function mapEventDetail(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    type: formatEventType(row.event_type),
    rawType: row.event_type,
    description: row.description || "",
    date: row.event_date,
    startTime: row.start_time || null,
    endTime: row.end_time || null,
    location: row.location || "",
    registrationDeadline: row.registration_deadline || null,
    status: row.event_status,
    imagePath: row.image_path || null,
    image: getPublicMediaUrl(row.image_path),
    entryFormPath: row.entry_form_path || null,
    entryFormUrl: getEventDocumentUrl(row.entry_form_path),
  };
}

// Map database row to shape used by AdminEventsPanel
function mapAdminEvent(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    name: row.title, // Keep name as alias for display
    slug: row.slug,
    type: row.event_type,
    displayType: formatEventType(row.event_type),
    description: row.description || "",
    date: row.event_date,
    startTime: row.start_time || "",
    endTime: row.end_time || "",
    location: row.location || "",
    registrationDeadline: row.registration_deadline || "",
    status: row.event_status,
    entryFormPath: row.entry_form_path || "",
    imagePath: row.image_path || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Fetch published events for the public Events page (listing and calendar)
export async function getPublishedEvents() {
  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      event_type,
      event_date,
      location
    `)
    .eq("event_status", "published")
    .order("event_date", { ascending: true });

  if (error) throw error;

  return (data || []).map(mapEventSummary);
}

// Fetch a single published event by UUID for EventDetailPage.
// Drafts, cancelled, or completed events will return null to regular visitors.
export async function getPublishedEventById(id) {
  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      slug,
      event_type,
      description,
      event_date,
      start_time,
      end_time,
      location,
      registration_deadline,
      event_status,
      entry_form_path,
      image_path
    `)
    .eq("id", id)
    .eq("event_status", "published")
    .maybeSingle();

  if (error) throw error;
  return mapEventDetail(data);
}

// Fetch all events for AdminEventsPanel (RLS permits administrators to view all statuses)
export async function getEventsForAdmin() {
  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      slug,
      event_type,
      description,
      event_date,
      start_time,
      end_time,
      location,
      registration_deadline,
      event_status,
      entry_form_path,
      image_path,
      created_at,
      updated_at
    `)
    .order("event_date", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapAdminEvent);
}

// Create a new event in Supabase
export async function createEvent(eventData) {
  const title = eventData.title || eventData.name;
  const slug = eventData.slug || generateSlug(title);

  const payload = {
    title,
    slug,
    event_type: eventData.type || eventData.eventType,
    description: eventData.description || null,
    event_date: eventData.date || eventData.eventDate,
    start_time: eventData.startTime || null,
    end_time: eventData.endTime || null,
    location: eventData.location || null,
    registration_deadline: eventData.registrationDeadline || null,
    event_status: eventData.status || eventData.eventStatus || "draft",
    entry_form_path: eventData.entryFormPath || null,
    image_path: eventData.imagePath || null,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapAdminEvent(data);
}

// Update an existing event in Supabase
export async function updateEvent(id, eventData) {
  const title = eventData.title || eventData.name;

  const payload = {
    title,
    event_type: eventData.type || eventData.eventType,
    description: eventData.description || null,
    event_date: eventData.date || eventData.eventDate,
    start_time: eventData.startTime || null,
    end_time: eventData.endTime || null,
    location: eventData.location || null,
    registration_deadline: eventData.registrationDeadline || null,
    event_status: eventData.status || eventData.eventStatus,
    entry_form_path: eventData.entryFormPath || null,
    image_path: eventData.imagePath || null,
  };

  if (eventData.slug) {
    payload.slug = eventData.slug;
  }

  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapAdminEvent(data);
}

// Delete an event by UUID
export async function deleteEvent(id) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) throw error;
}