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
          .order("wins", { ascending: false })
          .limit(50)
      : supabase
          .from("users")
          .select("id, username, wins, losses")
          .order("wins", { ascending: false })
          .limit(50),
    city
      ? supabase
          .from("crews")
          .select("id, name, city, crew_members(users(wins))")
          .eq("city", city)
          .limit(20)
      : supabase
          .from("crews")
          .select("id, name, city, crew_members(users(wins))")
          .limit(20),
  ]);

  // Aggregate crew wins
  const crewRankings = (crews ?? [])
    .map((crew) => {
      const totalWins = (crew.crew_members as unknown as { users: { wins: number } | null }[])
        .reduce((sum, m) => sum + (m.users?.wins ?? 0), 0);
      return { id: crew.id, name: crew.name, city: crew.city, wins: totalWins };
    })
    .sort((a, b) => b.wins - a.wins);

  return (
    <LeaderboardClient
      players={(players ?? []).map((p, i) => ({ ...p, rank: i + 1 }))}
      crews={crewRankings.map((c, i) => ({ ...c, rank: i + 1 }))}
      city={city}
      currentUserId={user.id}
    />
  );
}
