import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { isUUID } from "@/lib/validate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  if (!isUUID(matchId)) return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { winner_crew_id?: unknown };
  const { winner_crew_id } = body;
  if (!isUUID(winner_crew_id)) return NextResponse.json({ error: "Invalid winner_crew_id" }, { status: 400 });

  const { data: match } = await supabase
    .from("crew_matches")
    .select("id, status, challenger_crew_id, opponent_crew_id, winner_crew_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "active") return NextResponse.json({ error: "Match is not active" }, { status: 409 });
  if (match.winner_crew_id !== null) return NextResponse.json({ error: "Result already submitted" }, { status: 409 });

  if (winner_crew_id !== match.challenger_crew_id && winner_crew_id !== match.opponent_crew_id) {
    return NextResponse.json({ error: "winner_crew_id must be a participating crew" }, { status: 400 });
  }

  // The function resolves the caller's crew from crew_match_participants and
  // records that crew's claim. The match completes only once BOTH crews report
  // (migration 022) — a single participant can no longer name the winner.
  const { data, error } = await adminClient.rpc("submit_crew_match_result", {
    p_crew_match_id: matchId,
    p_user_id: user.id,
    p_winner_crew_id: winner_crew_id,
  });

  if (error) {
    if (error.message.includes("not_participant")) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }
    if (error.message.includes("already_submitted")) {
      return NextResponse.json({ error: "Your crew already submitted a result" }, { status: 409 });
    }
    if (error.message.includes("crew_match_not_active")) {
      return NextResponse.json({ error: "Match is not active" }, { status: 409 });
    }
    if (error.message.includes("crew_match_not_updatable")) {
      return NextResponse.json({ error: "Result already submitted" }, { status: 409 });
    }
    if (error.message.includes("invalid_winner_crew")) {
      return NextResponse.json({ error: "winner_crew_id must be a participating crew" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit result" }, { status: 500 });
  }

  return NextResponse.json({ status: data }); // 'waiting' | 'completed' | 'disputed'
}
