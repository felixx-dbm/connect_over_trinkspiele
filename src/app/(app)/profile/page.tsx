import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, MapPin, Trophy, Swords, TrendingUp, Clock, ChevronRight, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import type { MatchRow } from "@/lib/types";
import ProfileEditButton from "./ProfileEditButton";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: recentMatches }, { data: crewMember }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("matches")
      .select("id, status, mode, created_at, winner_id, game_types(name), opponent:opponent_id(username), challenger:challenger_id(username)")
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("crew_members")
      .select("role, crews(id, name)")
      .eq("user_id", user.id)
      .single(),
  ]);

  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
  const winRate = profile && (profile.wins + profile.losses) > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
    : 0;
  const crew = crewMember?.crews as unknown as { id: string; name: string } | null;

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-xl text-zinc-100">
          MY <span className="text-amber-400">PROFILE</span>
        </h1>
        <Link
          href="/settings"
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <Settings size={16} className="text-zinc-400" />
        </Link>
      </div>

      {/* Profile card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center font-display text-zinc-950 text-xl">
              {initials}
            </div>
            <ProfileEditButton username={profile?.username ?? ""} city={profile?.city ?? ""} />
          </div>
          <div>
            <h2 className="font-display text-2xl text-zinc-100">{profile?.username ?? "—"}</h2>
            <div className="flex items-center gap-2 mt-1">
              {profile?.city && (
                <div className="flex items-center gap-1 text-zinc-500 text-xs">
                  <MapPin size={11} />
                  {profile.city}
                </div>
              )}
              {crew && (
                <>
                  <span className="text-zinc-700">·</span>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <Users size={11} />
                    {crew.name}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Wins", value: profile?.wins ?? 0, Icon: Trophy, color: "text-amber-400" },
            { label: "Losses", value: profile?.losses ?? 0, Icon: Swords, color: "text-zinc-400" },
            { label: "Win Rate", value: `${winRate}%`, Icon: TrendingUp, color: "text-green-400" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-zinc-800 rounded-xl p-3 text-center">
              <Icon size={14} className={`${color} mx-auto mb-1`} />
              <p className={`font-display text-xl ${color}`}>{value}</p>
              <p className="text-zinc-600 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-5">
        {[
          crew
            ? { label: "My Crew", sublabel: crew.name, Icon: Users, href: "/crews" }
            : { label: "Create a Crew", sublabel: "Start your own team", Icon: Users, href: "/crews" },
          { label: "Leaderboard", sublabel: profile?.city ? `Rankings in ${profile.city}` : "City rankings", Icon: Trophy, href: "/leaderboard" },
          { label: "Settings", sublabel: "Account & preferences", Icon: Settings, href: "/settings" },
        ].map(({ label, sublabel, Icon, href }, i) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors cursor-pointer ${i !== 0 ? "border-t border-zinc-800" : ""}`}
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-zinc-200 text-sm font-medium">{label}</p>
              <p className="text-zinc-600 text-xs">{sublabel}</p>
            </div>
            <ChevronRight size={14} className="text-zinc-700" />
          </Link>
        ))}
      </div>

      {/* Recent matches */}
      {recentMatches && recentMatches.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 text-center">
          <Swords size={24} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">No battles yet</p>
          <Link href="/matches/new" className="text-amber-400 text-sm hover:text-amber-300 transition-colors mt-1 inline-block">
            Start your first →
          </Link>
        </div>
      )}
      {recentMatches && recentMatches.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Recent Battles</p>
          <div className="flex flex-col gap-2">
            {(recentMatches as unknown as MatchRow[]).map((match) => {
              const isWin = match.winner_id === user.id;
              const opponentName = match.challenger_id === user.id
                ? match.opponent?.username
                : match.challenger?.username;
              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 transition-all cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs flex-shrink-0 ${
                    isWin
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}>
                    {isWin ? "W" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-200 text-sm font-medium truncate">vs {opponentName ?? "Unknown"}</p>
                    <p className="text-zinc-600 text-xs capitalize">{match.game_types?.name?.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock size={11} className="text-zinc-700" />
                    <span className="text-zinc-600 text-xs">
                      {new Date(match.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Sign out */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full h-12 flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500/5 rounded-2xl text-sm font-medium transition-all cursor-pointer"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
