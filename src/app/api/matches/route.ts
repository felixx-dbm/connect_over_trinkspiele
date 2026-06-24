import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUUID } from "@/lib/validate";
import { fuzzCoords } from "@/lib/geo";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    game_type_id?: unknown;
    direct_opponent_id?: unknown;
    lat?: unknown;
    lng?: unknown;
  };
  const { game_type_id, direct_opponent_id, lat, lng } = body;

  if (!isUUID(game_type_id)) return NextResponse.json({ error: "Invalid game_type_id" }, { status: 400 });
  if (direct_opponent_id !== undefined && !isUUID(direct_opponent_id)) {
    return NextResponse.json({ error: "Invalid direct_opponent_id" }, { status: 400 });
  }

  // Fetch team_size for this game type
  const { data: gameType } = await supabase.from("game_types").select("team_size").eq("id", game_type_id).single();
  const teamSize = gameType?.team_size ?? 1;

  // Check if user has an active event to tag
  const { data: activeMembership } = await supabase
    .from("event_members")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  const eventId = activeMembership?.event_id ?? null;

  // Fuzz coordinates if provided
  let locationWkt: string | null = null;
  if (typeof lat === "number" && typeof lng === "number") {
    const fuzzy = fuzzCoords(lat, lng);
    locationWkt = `POINT(${fuzzy.lng} ${fuzzy.lat})`;
  }

  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      game_type_id,
      mode: "regional",
      status: "open",
      challenger_id: user.id,
      challenger_type: "user",
      team_size: teamSize,
      slots_challenger: teamSize > 1 ? 0 : 1,
      ...(direct_opponent_id ? { direct_opponent_id } : {}),
      ...(eventId ? { event_id: eventId } : {}),
      ...(locationWkt ? { location: locationWkt } : {}),
    })
    .select("id")
    .single();

  if (error || !match) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });

  // Auto-join creator into challenger team for team games
  if (teamSize > 1) {
    await supabase.from("match_members").insert({ match_id: match.id, user_id: user.id, team: "challenger" });
  }

  return NextResponse.json({ id: match.id });
}
