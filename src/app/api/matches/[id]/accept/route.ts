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
    .select("id, status, challenger_id, opponent_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "open") return NextResponse.json({ error: "Match is not open" }, { status: 409 });
  if (match.challenger_id === user.id) return NextResponse.json({ error: "Cannot accept your own match" }, { status: 400 });

  // Retire the user's own *unaccepted* challenges before joining this one.
  // Previously this also cancelled their ACTIVE matches, silently killing a game
  // their current opponent was mid-way through. An active match now blocks the
  // accept instead, with an error the player can act on.
  const { data: activeOwn } = await adminClient
    .from("matches")
    .select("id")
    .eq("challenger_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (activeOwn) {
    return NextResponse.json(
      { error: "Finish or cancel your current match before accepting another." },
      { status: 409 }
    );
  }

  await adminClient
    .from("matches")
    .update({ status: "cancelled" })
    .eq("challenger_id", user.id)
    .eq("status", "open");

  // Service-role write: authenticated has no UPDATE on matches (migration 021), so
  // status/winner_id can't be forged alongside the accept.
  // .is("opponent_id", null) prevents IDOR overwrite; count=0 means another player beat us to it
  const { data: updated, error } = await adminClient
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
