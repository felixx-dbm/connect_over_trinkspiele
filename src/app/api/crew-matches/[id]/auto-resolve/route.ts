/**
 * POST /api/crew-matches/[id]/auto-resolve — accept the one submitted crew
 * result as truth after 10 minutes, so a silent crew can't strand a battle.
 * Mirrors /api/matches/[id]/auto-resolve for solo matches.
 */
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

  // Only someone in the battle may trigger it.
  const { data: participant } = await supabase
    .from("crew_match_participants")
    .select("id")
    .eq("crew_match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  // Function is revoked from PUBLIC (migration 022), so it runs via service_role.
  const { data, error } = await adminClient.rpc("auto_resolve_crew_match", {
    p_crew_match_id: matchId,
  });

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({ status: data }); // 'resolved' | 'not_ready' | 'already_done' | 'not_found'
}
