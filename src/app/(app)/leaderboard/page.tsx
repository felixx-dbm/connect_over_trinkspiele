import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("city")
    .eq("id", user.id)
    .single();

  const city = profile?.city ?? null;

  const [{ data: players }, { data: crews }] = await Promise.all([
    city
      ? supabase
          .from("users")
          .select("id, username, wins, losses")
          .eq("city", city)
          .eq("show_on_leaderboard", true)
          .order("wins", { ascending: false })
          .limit(50)
      : supabase
          .from("users")
          .select("id, username, wins, losses")
          .eq("show_on_leaderboard", true)
          .order("wins", { ascending: false })
          .limit(50),
    city
      ? supabase
          .from("crews")
          .select("id, name, city, crew_wins")
          .eq("city", city)
          .order("crew_wins", { ascending: false })
          .limit(20)
      : supabase
          .from("crews")
          .select("id, name, city, crew_wins")
          .order("crew_wins", { ascending: false })
          .limit(20),
  ]);

  const crewRankings = (crews ?? []).map((crew) => ({
    id: crew.id, name: crew.name, city: crew.city,
    wins: (crew as unknown as { crew_wins: number }).crew_wins ?? 0,
  }));

  return (
    <LeaderboardClient
      players={(players ?? []).map((p, i) => ({ ...p, rank: i + 1 }))}
      crews={crewRankings.map((c, i) => ({ ...c, rank: i + 1 }))}
      city={city}
      currentUserId={user.id}
    />
  );
}
