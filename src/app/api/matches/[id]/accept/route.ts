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
    .from("matches")
    .select("id, status, challenger_id, opponent_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "open") return NextResponse.json({ error: "Match is not open" }, { status: 409 });
  if (match.challenger_id === user.id) return NextResponse.json({ error: "Cannot accept your own match" }, { status: 400 });

  // .is("opponent_id", null) prevents IDOR overwrite; count=0 means another player beat us to it
  const { data: updated, error } = await supabase
    .from("matches")
    .update({ opponent_id: user.id, status: "active" })
    .eq("id", matchId)
    .eq("status", "open")
    .is("opponent_id", null)
    .select("id");

  if (error) return NextResponse.json({ error: "Failed to accept match" }, { status: 500 });
  if (!updated || updated.length === 0) return NextResponse.json({ error: "Match already accepted" }, { status: 409 });

  return NextResponse.json({ ok: true });
}
