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

  const body = await request.json() as { result?: unknown };
  const { result } = body;
  if (result !== "win" && result !== "loss") {
    return NextResponse.json({ error: "result must be 'win' or 'loss'" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("submit_player_result", {
    p_match_id: matchId,
    p_user_id:  user.id,
    p_result:   result,
  });

  if (error) {
    if (error.message.includes("match_not_active"))  return NextResponse.json({ error: "Match is not active" }, { status: 409 });
    if (error.message.includes("already_submitted")) return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    if (error.message.includes("not_participant"))   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Failed to submit result" }, { status: 500 });
  }

  return NextResponse.json({ status: data }); // 'waiting' | 'completed' | 'disputed'
}
