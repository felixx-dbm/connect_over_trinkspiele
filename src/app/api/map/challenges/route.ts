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

  // Fetch nearby open matches and queue entries using PostGIS ST_DWithin
  const [{ data: matches }, { data: queue }] = await Promise.all([
    supabase.rpc("nearby_open_matches", { user_lat: lat, user_lng: lng, radius_km: radiusKm }),
    supabase.rpc("nearby_queue_entries", { user_lat: lat, user_lng: lng, radius_km: radiusKm }),
  ]);

  return NextResponse.json({ matches: matches ?? [], queue: queue ?? [] });
}
