import { supabase } from "../lib/supabaseClient";

function mapEvent(row) {
  return {
    id: row.id,
    name: row.title,
    type: formatEventType(row.event_type),
    date: row.event_date,
    location: row.location,
  };
}

function formatEventType(value) {
  if (!value) return "Event";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

  return (data || []).map(mapEvent);
}