import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, MapPin, Trophy, Swords, TrendingUp, Clock, ChevronRight, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { getT } from "@/lib/i18n-server";
import type { MatchRow, UserAchievementRow } from "@/lib/types";
import ProfileEditButton from "./ProfileEditButton";
import ProfileChallengeQR from "./ProfileChallengeQR";
import AvatarUpload from "./AvatarUpload";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getT();

  const [{ data: profile }, { data: recentMatches }, { data: crewMember }, { data: achievementsData }] = await Promise.all([
    supabase.from("users").select("username, wins, losses, city, avatar_url").eq("id", user.id).single(),
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
        <div>
          <p className="eyebrow mb-1">{t.profile.title}</p>
          <h1 className="display text-3xl">{t.profile.titleAccent}</h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="w-10 h-10 border border-[#14110F] flex items-center justify-center hover:bg-[#14110F] hover:text-[#FAF8F3] transition-colors cursor-pointer"
        >
          <Settings size={16} />
        </Link>
      </div>

      {/* Profile hero card */}
      <div className="border border-[#14110F] p-5 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <AvatarUpload
              userId={user.id}
              initials={initials}
              avatarUrl={(profile as { avatar_url?: string | null } | null)?.avatar_url ?? null}
            />
            <ProfileEditButton username={profile?.username ?? ""} city={profile?.city ?? ""} />
          </div>
          <div>
            <h2 className="display text-2xl">{profile?.username ?? "—"}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {profile?.city && (
                <div className="flex items-center gap-1 text-[#4A3F2C] text-xs font-medium">
                  <MapPin size={11} className="text-amber-700" />
                  {profile.city}
                </div>
              )}
              {crew && (
                <>
                  <span className="text-[#E3DCCB]">·</span>
                  <div className="flex items-center gap-1 text-[#4A3F2C] text-xs font-medium">
                    <Users size={11} className="text-violet-700" />
                    {crew.name}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#E3DCCB] border-t border-b border-[#14110F]">
          {[
            { label: t.profile.wins,    value: profile?.wins ?? 0,   Icon: Trophy,     text: "text-amber-700",   icon: "text-amber-700"   },
            { label: t.profile.losses,  value: profile?.losses ?? 0, Icon: Swords,     text: "text-rose-700",    icon: "text-rose-700"    },
            { label: t.profile.winRate, value: `${winRate}%`,        Icon: TrendingUp, text: "text-emerald-700", icon: "text-emerald-700" },
          ].map(({ label, value, Icon, text, icon }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-4">
              <Icon size={14} className={icon} />
              <p className={`display text-xl ${text}`}>{value}</p>
              <p className="eyebrow">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="border border-[#14110F] mb-5">
        {[
          crew
            ? { label: t.profile.myCrew,     sublabel: crew.name,                                                  Icon: Users,    href: "/crews",       color: "text-violet-700" }
            : { label: t.profile.createCrew, sublabel: t.profile.createCrewHint,                                   Icon: Users,    href: "/crews",       color: "text-violet-700" },
          {   label: t.profile.leaderboard,  sublabel: profile?.city ? t.profile.rankingsIn.replace("{city}", profile.city) : t.profile.cityRankings, Icon: Trophy, href: "/leaderboard", color: "text-amber-700"  },
          {   label: t.profile.settings,     sublabel: t.profile.settingsHint,                                     Icon: Settings, href: "/settings",    color: "text-[#4A3F2C]"  },
        ].map(({ label, sublabel, Icon, href, color }, i) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-4 hover:bg-amber-50 transition-colors cursor-pointer ${i !== 0 ? "border-t border-[#E3DCCB]" : ""}`}
          >
            <Icon size={16} className={`${color} flex-shrink-0`} />
            <div className="flex-1">
              <p className="text-sm font-bold">{label}</p>
              <p className="text-[#4A3F2C] text-xs font-medium">{sublabel}</p>
            </div>
            <ChevronRight size={14} className="text-[#6B5D42]" />
          </Link>
        ))}
      </div>

      {/* Recent matches */}
      {recentMatches && recentMatches.length === 0 && (
        <div className="border border-[#14110F] p-6 mb-6 text-center">
          <div className="text-4xl mb-2">⚔️</div>
          <p className="text-[#4A3F2C] text-sm font-medium">{t.profile.noBattles}</p>
          <Link href="/matches/new" className="link-arrow text-sm mt-1 inline-flex">
            {t.profile.startFirst}
          </Link>
        </div>
      )}

      {recentMatches && recentMatches.length > 0 && (
        <div className="mb-6">
          <p className="eyebrow mb-3">{t.profile.recentBattles}</p>
          <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
            {(recentMatches as unknown as MatchRow[]).map((match) => {
              const isWin = match.winner_id === user.id;
              const opponentName = match.challenger_id === user.id
                ? match.opponent?.username
                : match.challenger?.username;
              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex items-center gap-3 py-3 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <div className={`w-9 h-9 border flex items-center justify-center display-upright text-xs flex-shrink-0 ${
                    isWin
                      ? "border-emerald-700 bg-emerald-600 text-white"
                      : "border-rose-700 text-rose-700"
                  }`}>
                    {isWin ? "W" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.profile.vs} {opponentName ?? "Unknown"}</p>
                    <p className="text-[#4A3F2C] text-xs font-medium capitalize">{match.game_types?.name?.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock size={11} className="text-[#6B5D42]" />
                    <span className="text-[#4A3F2C] text-xs font-medium">
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
          <p className="eyebrow mb-3">{t.achievements.title}</p>
          <div className="flex flex-wrap gap-2">
            {achievements.map(({ achievement }) => {
              const def = (t.achievements as Record<string, unknown>)[achievement] as { label: string; desc: string } | undefined;
              if (!def) return null;
              return (
                <div key={achievement} title={def.desc} className="flex items-center gap-1.5 border border-[#14110F] px-3 py-1.5">
                  <span className="text-sm">{
                    achievement === "first_win"     ? "🩸" :
                    achievement === "five_wins"     ? "⚡" :
                    achievement === "loss_accepted" ? "🍺" :
                    achievement === "honest_10"     ? "🤝" :
                    achievement === "legend_20"     ? "👑" :
                    achievement === "on_fire"       ? "🔥" :
                    achievement === "crew_champion" ? "🏆" : "✨"
                  }</span>
                  <span className="text-xs font-bold">{def.label}</span>
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
          className="w-full h-12 flex items-center justify-center text-rose-700 border border-rose-700 hover:bg-rose-50 text-sm font-bold transition-colors cursor-pointer"
        >
          {t.common.signOut}
        </button>
      </form>
    </div>
  );
}
