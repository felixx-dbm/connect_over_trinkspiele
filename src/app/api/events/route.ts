import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { name?: unknown; city?: unknown };
  const { name, city } = body;
  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "name must be at least 2 characters" }, { status: 400 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({ name: name.trim(), city: typeof city === "string" ? city.trim() || null : null, created_by: user.id })
    .select("id, join_code")
    .single();

  if (error || !event) return NextResponse.json({ error: error?.message ?? "Failed to create event" }, { status: 500 });

  // Auto-join creator as active member
  await supabase.from("event_members").insert({ event_id: event.id, user_id: user.id, is_active: true });

  return NextResponse.json({ id: event.id, join_code: event.join_code });
}
