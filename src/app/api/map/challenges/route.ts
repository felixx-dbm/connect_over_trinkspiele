import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radiusKm = Math.min(parseInt(searchParams.get("radius") ?? "10"), 50);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const [{ data: matches }, { data: queue }, { data: ownMatches }, { data: myQueue }] = await Promise.all([
    supabase.rpc("nearby_open_matches", { user_lat: lat, user_lng: lng, radius_km: radiusKm }),
    supabase.rpc("nearby_queue_entries", { user_lat: lat, user_lng: lng, radius_km: radiusKm }),
    supabase.from("matches").select("id").eq("challenger_id", user.id).eq("status", "open").limit(10),
    supabase.from("match_queue").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  const ownMatchIds = new Set((ownMatches ?? []).map((m: { id: string }) => m.id));
  const myQueueId = myQueue?.id;

  return NextResponse.json({
    matches: (matches ?? []).map((m: { id: string }) => ({ ...m, is_own: ownMatchIds.has(m.id) })),
    queue: (queue ?? []).map((q: { id: string }) => ({ ...q, is_own: q.id === myQueueId })),
  });
}
