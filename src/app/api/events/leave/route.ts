import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUUID } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { event_id?: unknown };
  if (!isUUID(body.event_id)) return NextResponse.json({ error: "Invalid event_id" }, { status: 400 });

  await supabase
    .from("event_members")
    .update({ is_active: false })
    .eq("event_id", body.event_id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
