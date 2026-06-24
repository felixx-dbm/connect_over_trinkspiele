import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CrewsClient from "./CrewsClient";

export default async function CrewsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("crew_members")
    .select("role, crews(id, name, city, invite_code, captain_id, crew_wins)")
    .eq("user_id", user.id)
    .maybeSingle();

  const crew = membership?.crews as unknown as {
    id: string; name: string; city: string | null; invite_code: string; captain_id: string; crew_wins: number;
  } | null;

  let members: { id: string; user_id: string; role: string; users: { username: string; wins: number } | null }[] = [];

  if (crew) {
    const { data } = await supabase
      .from("crew_members")
      .select("id, user_id, role, users(username, wins)")
      .eq("crew_id", crew.id)
      .order("role", { ascending: true }); // captain first
    members = (data ?? []) as unknown as typeof members;
  }

  const totalWins = members.reduce((sum, m) => sum + (m.users?.wins ?? 0), 0);

  return (
    <CrewsClient
      crew={crew}
      members={members}
      totalWins={totalWins}
      currentUserId={user.id}
    />
  );
}
