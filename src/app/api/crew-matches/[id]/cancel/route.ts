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
    .select("id, status, created_by")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "open") return NextResponse.json({ error: "Only open challenges can be cancelled" }, { status: 409 });
  if (match.created_by !== user.id) return NextResponse.json({ error: "Only the creator can cancel" }, { status: 403 });

  const { error } = await supabase
    .from("crew_matches")
    .update({ status: "cancelled" })
    .eq("id", matchId)
    .eq("status", "open")
    .eq("created_by", user.id);

  if (error) return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
