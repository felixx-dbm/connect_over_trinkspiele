import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { isUUID } from "@/lib/validate";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  if (!isUUID(eventId)) return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: event } = await supabase
    .from("events")
    .select("id, created_by")
    .eq("id", eventId)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.created_by !== user.id) return NextResponse.json({ error: "Only the creator can delete this event" }, { status: 403 });

  await adminClient.from("event_members").delete().eq("event_id", eventId);
  const { error } = await adminClient.from("events").delete().eq("id", eventId);

  if (error) return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
