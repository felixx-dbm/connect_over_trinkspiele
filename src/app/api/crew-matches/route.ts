import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUUID, isValidLat, isValidLng } from "@/lib/validate";
import { fuzzCoords } from "@/lib/geo";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { game_type_id?: unknown; lat?: unknown; lng?: unknown };
  const { game_type_id, lat, lng } = body;

  if (!isUUID(game_type_id)) return NextResponse.json({ error: "Invalid game_type_id" }, { status: 400 });

  // Resolve the user's crew
  const { data: membership } = await supabase
    .from("crew_members")
    .select("crew_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Not in a crew" }, { status: 403 });
  const crewId = membership.crew_id;

  // Fuzz location if provided
  let locationWkt: string | null = null;
  if (typeof lat === "number" && typeof lng === "number" && isValidLat(lat) && isValidLng(lng)) {
    const fuzzy = fuzzCoords(lat, lng);
    locationWkt = `POINT(${fuzzy.lng} ${fuzzy.lat})`;
  }

  // Insert crew match (RLS: auth.uid() = created_by AND challenger_crew_id in user's crews)
  const { data: match, error: matchError } = await supabase
    .from("crew_matches")
    .insert({
      game_type_id,
      challenger_crew_id: crewId,
      created_by: user.id,
      ...(locationWkt ? { location: locationWkt } : {}),
    })
    .select("id, join_code")
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: matchError?.message ?? "Failed to create match" }, { status: 500 });
  }

  // Auto-join creator as participant
  await supabase
    .from("crew_match_participants")
    .insert({ crew_match_id: match.id, user_id: user.id, crew_id: crewId });

  return NextResponse.json({ id: match.id, join_code: match.join_code });
}
