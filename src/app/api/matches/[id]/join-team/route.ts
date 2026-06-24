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

  const body = await request.json() as { team?: unknown };
  const { team } = body;
  if (team !== "challenger" && team !== "opponent") {
    return NextResponse.json({ error: "team must be 'challenger' or 'opponent'" }, { status: 400 });
  }

  const { data: match } = await supabase
    .from("matches")
    .select("id, status, team_size, slots_challenger, slots_opponent, challenger_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "open") return NextResponse.json({ error: "Match is not open" }, { status: 409 });

  // Check slot availability
  const filled = team === "challenger" ? match.slots_challenger : match.slots_opponent;
  if (filled >= match.team_size) {
    return NextResponse.json({ error: "Team is full" }, { status: 409 });
  }

  // Challenger can't join opponent team if they created the match
  if (team === "opponent" && match.challenger_id === user.id) {
    return NextResponse.json({ error: "Cannot join the opposing team of your own challenge" }, { status: 400 });
  }

  const { error } = await supabase
    .from("match_members")
    .insert({ match_id: matchId, user_id: user.id, team });

  if (error) {
    if (error.message.includes("duplicate")) {
      return NextResponse.json({ error: "Already joined" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }

  // When first opponent joins, set opponent_id on the match (keeps backward compat)
  if (team === "opponent") {
    await supabase
      .from("matches")
      .update({ opponent_id: user.id })
      .eq("id", matchId)
      .is("opponent_id", null);
  }

  return NextResponse.json({ ok: true });
}
