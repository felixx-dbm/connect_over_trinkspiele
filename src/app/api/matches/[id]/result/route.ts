import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const body = await request.json() as { winner_id: string };
  const { winner_id } = body;

  if (!isUUID(winner_id)) return NextResponse.json({ error: "winner_id must be a valid UUID" }, { status: 400 });

  // Fetch match to verify caller is a participant and match is active
  const { data: match } = await supabase
    .from("matches")
    .select("id, status, challenger_id, opponent_id, winner_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "active") return NextResponse.json({ error: "Match is not active" }, { status: 409 });
  if (match.winner_id) return NextResponse.json({ error: "Result already submitted" }, { status: 409 });
  if (match.challenger_id !== user.id && match.opponent_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (winner_id !== match.challenger_id && winner_id !== match.opponent_id) {
    return NextResponse.json({ error: "winner_id must be a match participant" }, { status: 400 });
  }

  const loserId = winner_id === match.challenger_id ? match.opponent_id : match.challenger_id;

  // All three writes in a single RPC to keep wins/losses atomic
  const { error } = await supabase.rpc("submit_match_result", {
    p_match_id: matchId,
    p_winner_id: winner_id,
    p_loser_id: loserId,
  });

  if (error) {
    console.error("[result]", error.message);
    return NextResponse.json({ error: "Failed to submit result" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
