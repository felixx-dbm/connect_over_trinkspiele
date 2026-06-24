import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { join_code?: unknown };
  const code = typeof body.join_code === "string" ? body.join_code.trim().toUpperCase() : "";
  if (code.length !== 6) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("join_code", code)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Upsert membership — trigger handles deactivating others
  const { error } = await supabase
    .from("event_members")
    .upsert({ event_id: event.id, user_id: user.id, is_active: true }, { onConflict: "event_id,user_id" });

  if (error) return NextResponse.json({ error: "Failed to join event" }, { status: 500 });

  return NextResponse.json({ id: event.id });
}
