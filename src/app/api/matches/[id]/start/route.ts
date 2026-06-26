import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { isUUID } from "@/lib/validate";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  if (!isUUID(matchId)) return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: match } = await supabase
    .from("matches")
    .select("id, status, is_open_lobby, challenger_id, slots_challenger, slots_opponent")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.challenger_id !== user.id) return NextResponse.json({ error: "Only the host can start" }, { status: 403 });
  if (!match.is_open_lobby) return NextResponse.json({ error: "Not an open lobby" }, { status: 400 });
  if (match.status !== "open") return NextResponse.json({ error: "Match is not open" }, { status: 409 });
  if (match.slots_challenger < 1 || match.slots_opponent < 1) {
    return NextResponse.json({ error: "Both teams need at least one player" }, { status: 400 });
  }

  const { error } = await adminClient
    .from("matches")
    .update({ status: "active" })
    .eq("id", matchId)
    .eq("status", "open");

  if (error) return NextResponse.json({ error: "Failed to start" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
