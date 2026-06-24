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

  // Read match state
  const { data: match } = await supabase
    .from("crew_matches")
    .select("id, status, challenger_crew_id, opponent_crew_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "open") return NextResponse.json({ error: "Match is not open" }, { status: 409 });
  if (match.opponent_crew_id !== null) return NextResponse.json({ error: "Match already accepted" }, { status: 409 });

  // Resolve caller's crew
  const { data: membership } = await supabase
    .from("crew_members")
    .select("crew_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Not in a crew" }, { status: 403 });
  const crewId = membership.crew_id;

  if (crewId === match.challenger_crew_id) {
    return NextResponse.json({ error: "Cannot accept your own crew's challenge" }, { status: 400 });
  }

  // Race-safe UPDATE — mirrors the solo match accept pattern
  const { data: updated, error } = await supabase
    .from("crew_matches")
    .update({ opponent_crew_id: crewId, status: "active", accepted_by: user.id })
    .eq("id", matchId)
    .eq("status", "open")
    .is("opponent_crew_id", null)
    .select("id");

  if (error) return NextResponse.json({ error: "Failed to accept match" }, { status: 500 });
  if (!updated || updated.length === 0) return NextResponse.json({ error: "Match already accepted" }, { status: 409 });

  // Auto-join acceptor as participant
  await supabase
    .from("crew_match_participants")
    .insert({ crew_match_id: matchId, user_id: user.id, crew_id: crewId });

  return NextResponse.json({ ok: true });
}
