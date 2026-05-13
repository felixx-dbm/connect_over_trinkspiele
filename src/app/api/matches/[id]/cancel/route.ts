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
    .select("id, status, challenger_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.challenger_id !== user.id) return NextResponse.json({ error: "Not your match" }, { status: 403 });
  if (match.status !== "open") return NextResponse.json({ error: "Can only cancel open matches" }, { status: 409 });

  const { error } = await supabase
    .from("matches")
    .update({ status: "cancelled" })
    .eq("id", matchId)
    .eq("status", "open")
    .eq("challenger_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to cancel match" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
