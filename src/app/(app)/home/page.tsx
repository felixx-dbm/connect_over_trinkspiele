import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Swords, Trophy, TrendingUp, Clock, ChevronRight, Flame, Users, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n-server";
import type { MatchRow } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getT();

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
  const greeting =
    hour < 5  ? t.home.greetNight :
    hour < 12 ? t.home.greetMorning :
    hour < 17 ? t.home.greetAfternoon :
    hour < 21 ? t.home.greetEvening : t.home.greetNight;
  const greetEmoji =
    hour < 5  ? "🌙" :
    hour < 12 ? "☀️" :
    hour < 17 ? "🌤️" :
    hour < 21 ? "🌅" : "🌙";

  const hasCity = !!profile?.city;
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";

  const allCompleted = (recentMatches ?? []) as unknown as MatchRow[];
  let streak = 0;
  for (const m of allCompleted) {
    if (m.winner_id === user.id) streak++;
    else break;
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-stone-500 text-sm mb-0.5 font-semibold">{greetEmoji} {greeting}</p>
          <h1 className="font-display text-2xl text-stone-900">
            {profile?.username?.toUpperCase() ?? "PLAYER"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-white border border-amber-100 flex items-center justify-center opacity-40 shadow-sm" title="Notifications coming soon">
            <Bell size={18} className="text-stone-500" />
          </div>
          <Link href="/profile">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-display text-white text-sm cursor-pointer shadow-md shadow-amber-200/60">
              {initials}
            </div>
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t.home.wins,    value: wins,          Icon: Trophy,    bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-600",   icon: "text-amber-500"   },
          { label: t.home.losses,  value: losses,        Icon: Swords,    bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-600",    icon: "text-rose-400"    },
          { label: t.home.winRate, value: `${winRate}%`, Icon: TrendingUp, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500" },
        ].map(({ label, value, Icon, bg, border, text, icon }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm`}>
            <Icon size={16} className={icon} />
            <span className={`font-display text-xl ${text}`}>{value}</span>
            <span className="text-stone-500 text-xs font-semibold">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Active match ── */}
      {activeMatch && (
        <div className="relative bg-white rounded-2xl p-4 mb-6 border border-amber-200 overflow-hidden shadow-md shadow-amber-100/60">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50/50 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-stone-500 uppercase tracking-widest font-bold">{t.home.liveMatch}</span>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold capitalize">
                {(activeMatch.game_types as unknown as { name: string } | null)?.name?.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-display text-white text-sm mb-1 mx-auto shadow-md shadow-amber-200/50">
                  {initials}
                </div>
                <p className="text-xs text-stone-600 font-bold">{t.home.you}</p>
              </div>
              <span className="font-display text-amber-500 text-2xl">VS</span>
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-display text-stone-600 text-sm mb-1 mx-auto">
                  {((activeMatch.opponent as unknown as { username: string } | null)?.username ??
                    (activeMatch.challenger as unknown as { username: string } | null)?.username ??
                    "??").slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs text-stone-600 font-bold">
                  {(activeMatch.opponent as unknown as { username: string } | null)?.username ??
                    (activeMatch.challenger as unknown as { username: string } | null)?.username ??
                    "Opponent"}
                </p>
              </div>
            </div>
            <Link
              href={`/matches/${activeMatch.id}`}
              className="mt-3 w-full h-10 flex items-center justify-center btn-gold rounded-xl text-sm cursor-pointer"
            >
              {t.home.goToMatch}
            </Link>
          </div>
        </div>
      )}

      {/* ── City nudge ── */}
      {!hasCity && (
        <Link
          href="/profile"
          className="flex items-center gap-3 bg-white border border-amber-200 rounded-2xl p-4 mb-6 hover:bg-amber-50 transition-colors cursor-pointer shadow-sm card-hover"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-stone-800 text-sm font-bold">{t.home.setCity}</p>
            <p className="text-stone-500 text-xs font-semibold">{t.home.setCityHint}</p>
          </div>
          <ChevronRight size={14} className="text-stone-400" />
        </Link>
      )}

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/matches/new"
          className="btn-gold rounded-2xl p-4 flex items-center gap-3 text-sm cursor-pointer"
        >
          <Swords size={20} />
          <span className="font-bold">{t.home.findBattle}</span>
        </Link>
        <Link
          href="/crews"
          className="bg-white border border-violet-200 text-violet-700 rounded-2xl p-4 flex items-center gap-3 font-bold text-sm transition-all cursor-pointer hover:bg-violet-50 shadow-sm"
        >
          <Users size={20} className="text-violet-500" />
          {t.home.myCrew}
        </Link>
      </div>

      {/* ── Win streak ── */}
      {streak >= 2 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Flame size={20} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-stone-800 font-extrabold text-sm">{t.home.streak.replace("{n}", String(streak))}</p>
            <p className="text-stone-500 text-xs font-semibold">{t.home.streakHint}</p>
          </div>
          <ChevronRight size={16} className="text-stone-400" />
        </div>
      )}

      {/* ── Recent matches ── */}
      {allCompleted.length > 0 && (
        <div>
          <h2 className="font-display text-sm text-stone-500 uppercase tracking-widest mb-3">{t.home.recentBattles}</h2>
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
                  className="flex items-center gap-3 bg-white border border-amber-100 hover:border-amber-300 rounded-2xl p-3 transition-all cursor-pointer shadow-sm card-hover"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display text-xs flex-shrink-0 ${
                    isWin
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-500 border border-rose-200"
                  }`}>
                    {isWin ? "W" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 text-sm font-bold truncate">{t.profile.vs} {opponentName ?? "Unknown"}</p>
                    <p className="text-stone-500 text-xs font-semibold capitalize">{match.game_types?.name?.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock size={11} className="text-stone-300" />
                    <span className="text-stone-400 text-xs font-semibold">
                      {new Date(match.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!activeMatch && allCompleted.length === 0 && (
        <div className="text-center py-14">
          <div className="text-5xl mb-4">🍺</div>
          <p className="text-stone-500 text-sm font-semibold mb-1">{t.home.noBattles}</p>
          <Link href="/matches/new" className="text-amber-600 font-bold text-sm hover:text-amber-700 transition-colors">
            {t.home.startFirst}
          </Link>
        </div>
      )}
    </div>
  );
}
