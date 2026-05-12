import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { fuzzCoords } from "@/lib/geo";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const gameTypeId = searchParams.get("game_type_id");
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radiusKm = Math.min(parseInt(searchParams.get("radius") ?? "5"), 50);

  if (!gameTypeId) return NextResponse.json({ error: "game_type_id required" }, { status: 400 });

  // Check if already queued for a different game type
  const { data: existing } = await supabase
    .from("match_queue")
    .select("game_type_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.game_type_id !== gameTypeId) {
    return NextResponse.json({ error: "Already queued for a different game type" }, { status: 409 });
  }

  // Upsert queue entry — fuzz coords server-side regardless of client input
  const location = !isNaN(lat) && !isNaN(lng)
    ? (() => { const f = fuzzCoords(lat, lng); return `POINT(${f.lng} ${f.lat})`; })()
    : null;

  await supabase
    .from("match_queue")
    .upsert(
      { user_id: user.id, game_type_id: gameTypeId, location, radius_km: radiusKm },
      { onConflict: "user_id" }
    );

  // Use admin client for the atomic proximity match to bypass RLS on the transaction
  const { data: matchId, error } = await adminClient.rpc("find_or_create_match", {
    p_user_id: user.id,
    p_game_type_id: gameTypeId,
  });

  if (error) {
    console.error("[matchmaking]", error.message);
    return NextResponse.json({ status: "waiting" });
  }

  if (matchId) {
    return NextResponse.json({ status: "matched", matchId });
  }

  return NextResponse.json({ status: "waiting" });
}
