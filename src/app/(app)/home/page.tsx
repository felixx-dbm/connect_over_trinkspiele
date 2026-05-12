import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Swords, Trophy, TrendingUp, Clock, ChevronRight, Flame, Users, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { MatchRow } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: recentMatches }, { data: activeMatch }] = await Promise.all([
    supabase.from("users").select("username, wins, losses, city").eq("id", user.id).single(),
    supabase
      .from("matches")
      .select("id, status, mode, created_at, winner_id, game_types(name), opponent:opponent_id(username), challenger:challenger_id(username)")
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(4),
    supabase
      .from("matches")
      .select("id, game_types(name), opponent:opponent_id(username), challenger:challenger_id(username)")
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good night," : hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : hour < 21 ? "Good evening," : "Good night,";

  const hasCity = !!profile?.city;
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";

  // Calculate current win streak from recent completed matches
  const allCompleted = (recentMatches ?? []) as unknown as MatchRow[];
  let streak = 0;
  for (const m of allCompleted) {
    if (m.winner_id === user.id) streak++;
    else break;
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-zinc-500 text-sm mb-0.5">{greeting}</p>
          <h1 className="font-display text-2xl text-zinc-100">
            {profile?.username?.toUpperCase() ?? "PLAYER"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center opacity-40" title="Notifications coming soon">
            <Bell size={18} className="text-zinc-400" />
          </div>
          <Link href="/profile">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-display text-zinc-950 text-sm cursor-pointer">
              {initials}
            </div>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Wins", value: wins, Icon: Trophy, color: "text-amber-400" },
          { label: "Losses", value: losses, Icon: Swords, color: "text-zinc-400" },
          { label: "Win Rate", value: `${winRate}%`, Icon: TrendingUp, color: "text-green-400" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center gap-1">
            <Icon size={16} className={color} />
            <span className={`font-display text-xl ${color}`}>{value}</span>
            <span className="text-zinc-600 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Active match */}
      {activeMatch && (
        <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-4 mb-6 amber-glow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-zinc-400 uppercase tracking-widest">Live Match</span>
            </div>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full capitalize">
              {(activeMatch.game_types as unknown as { name: string } | null)?.name?.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-display text-zinc-950 text-sm mb-1 mx-auto">
                {initials}
              </div>
              <p className="text-xs text-zinc-300 font-medium">You</p>
            </div>
            <span className="font-display text-amber-400 text-xl">VS</span>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-display text-zinc-300 text-sm mb-1 mx-auto">
                {((activeMatch.opponent as unknown as { username: string } | null)?.username ??
                  (activeMatch.challenger as unknown as { username: string } | null)?.username ??
                  "??").slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                {(activeMatch.opponent as unknown as { username: string } | null)?.username ??
                  (activeMatch.challenger as unknown as { username: string } | null)?.username ??
                  "Opponent"}
              </p>
            </div>
          </div>
          <Link
            href={`/matches/${activeMatch.id}`}
            className="mt-3 w-full h-10 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-xl transition-all cursor-pointer"
          >
            Go to match
          </Link>
        </div>
      )}

      {/* City nudge for new users */}
      {!hasCity && (
        <Link
          href="/profile"
          className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mb-6 hover:bg-amber-500/10 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-zinc-200 text-sm font-medium">Set your city</p>
            <p className="text-zinc-500 text-xs">Appear on the local leaderboard</p>
          </div>
          <ChevronRight size={14} className="text-zinc-600" />
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/matches/new"
          className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 rounded-2xl p-4 flex items-center gap-3 font-bold text-sm transition-all active:scale-[0.97] cursor-pointer amber-glow"
        >
          <Swords size={20} />
          Find Battle
        </Link>
        <Link
          href="/crews"
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-2xl p-4 flex items-center gap-3 font-medium text-sm transition-all cursor-pointer"
        >
          <Users size={20} className="text-amber-400" />
          My Crew
        </Link>
      </div>

      {/* Win streak */}
      {streak >= 2 && (
        <div className="bg-zinc-900 border border-orange-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Flame size={20} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-zinc-100 font-semibold text-sm">{streak}-game win streak!</p>
            <p className="text-zinc-500 text-xs">Keep it going — find your next opponent</p>
          </div>
          <ChevronRight size={16} className="text-zinc-600" />
        </div>
      )}

      {/* Recent matches */}
      {allCompleted.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-zinc-400 uppercase tracking-widest">Recent Battles</h2>
          </div>
          <div className="flex flex-col gap-2">
            {allCompleted.map((match) => {
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs ${
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Clock size={12} className="text-zinc-700" />
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

      {/* Empty state */}
      {!activeMatch && allCompleted.length === 0 && (
        <div className="text-center py-12">
          <Swords size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No battles yet.</p>
          <Link href="/matches/new" className="text-amber-400 text-sm hover:text-amber-300 transition-colors">
            Start your first one →
          </Link>
        </div>
      )}
    </div>
  );
}
