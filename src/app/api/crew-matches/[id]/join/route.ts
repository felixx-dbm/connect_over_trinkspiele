import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    .from("crew_matches")
    .select("id, status, challenger_crew_id, opponent_crew_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status === "completed" || match.status === "cancelled") {
    return NextResponse.json({ error: "Match is over" }, { status: 409 });
  }

  // Resolve caller's crew
  const { data: membership } = await supabase
    .from("crew_members")
    .select("crew_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Not in a crew" }, { status: 403 });
  const crewId = membership.crew_id;

  // Must be in one of the two participating crews
  if (crewId !== match.challenger_crew_id && crewId !== match.opponent_crew_id) {
    return NextResponse.json({ error: "Not in a participating crew" }, { status: 403 });
  }

  // Upsert — UNIQUE(crew_match_id, user_id) makes this idempotent
  const { error } = await supabase
    .from("crew_match_participants")
    .insert({ crew_match_id: matchId, user_id: user.id, crew_id: crewId });

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
