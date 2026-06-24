import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, MapPin, Trophy, Swords, TrendingUp, Clock, ChevronRight, Users, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { getT } from "@/lib/i18n-server";
import type { MatchRow, UserAchievementRow } from "@/lib/types";
import ProfileEditButton from "./ProfileEditButton";
import ProfileChallengeQR from "./ProfileChallengeQR";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getT();

  const [{ data: profile }, { data: recentMatches }, { data: crewMember }, { data: achievementsData }] = await Promise.all([
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
    supabase
      .from("user_achievements")
      .select("achievement, earned_at")
      .eq("user_id", user.id),
  ]);

  const achievements = (achievementsData ?? []) as Pick<UserAchievementRow, "achievement" | "earned_at">[];

  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";
  const winRate = profile && (profile.wins + profile.losses) > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
    : 0;
  const crew = crewMember?.crews as unknown as { id: string; name: string } | null;

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-xl text-stone-900">
          {t.profile.title} <span className="text-gradient">{t.profile.titleAccent}</span>
        </h1>
        <Link
          href="/settings"
          className="w-10 h-10 rounded-xl bg-white border border-amber-100 flex items-center justify-center hover:border-amber-300 transition-colors cursor-pointer shadow-sm"
        >
          <Settings size={16} className="text-stone-500" />
        </Link>
      </div>

      {/* Profile hero card */}
      <div className="relative bg-white border border-amber-100 rounded-3xl p-5 mb-5 overflow-hidden shadow-md shadow-amber-100/40">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-center gap-4 mb-5">
          <div className="relative flex-shrink-0">
            {/* Gradient ring avatar */}
            <div className="w-18 h-18 ring-gradient rounded-2xl p-0.5 shadow-lg shadow-amber-200/50" style={{width: '72px', height: '72px'}}>
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-display text-white text-2xl">
                {initials}
              </div>
            </div>
            <ProfileEditButton username={profile?.username ?? ""} city={profile?.city ?? ""} />
          </div>
          <div>
            <h2 className="font-display text-2xl text-stone-900">{profile?.username ?? "—"}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {profile?.city && (
                <div className="flex items-center gap-1 text-stone-500 text-xs font-semibold">
                  <MapPin size={11} className="text-amber-500" />
                  {profile.city}
                </div>
              )}
              {crew && (
                <>
                  <span className="text-stone-300">·</span>
                  <div className="flex items-center gap-1 text-stone-500 text-xs font-semibold">
                    <Users size={11} className="text-violet-500" />
                    {crew.name}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t.profile.wins,    value: profile?.wins ?? 0,   Icon: Trophy,    bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-600",   icon: "text-amber-500"   },
            { label: t.profile.losses,  value: profile?.losses ?? 0, Icon: Swords,    bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-600",    icon: "text-rose-400"    },
            { label: t.profile.winRate, value: `${winRate}%`,        Icon: TrendingUp, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500" },
          ].map(({ label, value, Icon, bg, border, text, icon }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-3 text-center shadow-sm`}>
              <Icon size={14} className={`${icon} mx-auto mb-1`} />
              <p className={`font-display text-xl ${text}`}>{value}</p>
              <p className="text-stone-500 text-xs font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden mb-5 shadow-sm">
        {[
          crew
            ? { label: t.profile.myCrew,     sublabel: crew.name,                                                  Icon: Users,    href: "/crews",       color: "text-violet-500", bg: "bg-violet-50"  }
            : { label: t.profile.createCrew, sublabel: t.profile.createCrewHint,                                   Icon: Users,    href: "/crews",       color: "text-violet-500", bg: "bg-violet-50"  },
          {   label: t.profile.leaderboard,  sublabel: profile?.city ? t.profile.rankingsIn.replace("{city}", profile.city) : t.profile.cityRankings, Icon: Trophy, href: "/leaderboard", color: "text-amber-500",  bg: "bg-amber-50"   },
          {   label: t.profile.settings,     sublabel: t.profile.settingsHint,                                     Icon: Settings, href: "/settings",    color: "text-stone-500",  bg: "bg-stone-100"  },
        ].map(({ label, sublabel, Icon, href, color, bg }, i) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-4 hover:bg-amber-50/60 transition-colors cursor-pointer ${i !== 0 ? "border-t border-amber-50" : ""}`}
          >
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={15} className={color} />
            </div>
            <div className="flex-1">
              <p className="text-stone-800 text-sm font-bold">{label}</p>
              <p className="text-stone-400 text-xs font-semibold">{sublabel}</p>
            </div>
            <ChevronRight size={14} className="text-stone-300" />
          </Link>
        ))}
      </div>

      {/* Recent matches */}
      {recentMatches && recentMatches.length === 0 && (
        <div className="bg-white border border-amber-100 rounded-2xl p-6 mb-6 text-center shadow-sm">
          <div className="text-4xl mb-2">⚔️</div>
          <p className="text-stone-500 text-sm font-semibold">{t.profile.noBattles}</p>
          <Link href="/matches/new" className="text-amber-600 font-bold text-sm hover:text-amber-700 transition-colors mt-1 inline-block">
            {t.profile.startFirst}
          </Link>
        </div>
      )}

      {recentMatches && recentMatches.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.profile.recentBattles}</p>
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
                  className="flex items-center gap-3 bg-white border border-amber-100 hover:border-amber-300 rounded-2xl p-3 transition-all cursor-pointer shadow-sm"
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
                    <p className="text-stone-400 text-xs font-semibold capitalize">{match.game_types?.name?.replace("_", " ")}</p>
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

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.achievements.title}</p>
          <div className="flex flex-wrap gap-2">
            {achievements.map(({ achievement }) => {
              const def = (t.achievements as Record<string, unknown>)[achievement] as { label: string; desc: string } | undefined;
              if (!def) return null;
              return (
                <div key={achievement} title={def.desc} className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-sm">{
                    achievement === "first_win"     ? "🩸" :
                    achievement === "five_wins"     ? "⚡" :
                    achievement === "loss_accepted" ? "🍺" :
                    achievement === "honest_10"     ? "🤝" :
                    achievement === "legend_20"     ? "👑" :
                    achievement === "on_fire"       ? "🔥" :
                    achievement === "crew_champion" ? "🏆" : "✨"
                  }</span>
                  <span className="text-stone-700 text-xs font-bold">{def.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenge Me QR */}
      <ProfileChallengeQR userId={user.id} t={t} />

      {/* Sign out */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full h-12 flex items-center justify-center text-rose-500 border border-rose-200 hover:bg-rose-50 rounded-2xl text-sm font-bold transition-all cursor-pointer"
        >
          {t.common.signOut}
        </button>
      </form>
    </div>
  );
}
