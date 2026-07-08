import { redirect } from "next/navigation";
import Link from "next/link";
import { Swords, Trophy, TrendingUp, Clock, ChevronRight, Flame, Users, MapPin, Zap } from "lucide-react";
import Image from "next/image";
import NotificationBell from "@/components/NotificationBell";
import Marquee from "@/components/Marquee";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n-server";
import type { MatchRow } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getT();

  const [{ data: profile }, { data: recentMatches }, { data: activeMatch }, { data: pendingChallenges }, { data: activeMembership }] = await Promise.all([
    supabase.from("users").select("username, wins, losses, city, avatar_url").eq("id", user.id).single(),
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
    supabase
      .from("matches")
      .select("id, game_types(name), challenger:challenger_id(username)")
      .eq("direct_opponent_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("event_members")
      .select("events(id, name)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const activeEvent = (activeMembership?.events as unknown as { id: string; name: string } | null) ?? null;

  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? t.home.greetNight :
    hour < 12 ? t.home.greetMorning :
    hour < 17 ? t.home.greetAfternoon :
    hour < 21 ? t.home.greetEvening : t.home.greetNight;

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
    <div className="min-h-screen pb-6">
      
                    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <Marquee />
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-2 mb-6">
        <div>
          <p className="eyebrow mb-1">{greeting}</p>
          <h1 className="display text-4xl">
            {profile?.username ?? "Player"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <Link href="/profile">
            <div className="w-10 h-10 border border-[#14110F] overflow-hidden bg-[#14110F] flex items-center justify-center display-upright text-[#FAF8F3] text-sm cursor-pointer relative">
              {(profile as { avatar_url?: string | null } | null)?.avatar_url
                ? <Image src={(profile as { avatar_url: string }).avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
                : initials
              }
            </div>
          </Link>
        </div>
      </div>

      {/* ── Ticker ── */}
      

      

      <div className="px-4">

        {/* ── Stats + streak ── */}
        <div className="mb-8">
          <div className="grid grid-cols-3 divide-x divide-[#E3DCCB] border-t border-b border-[#14110F]">
            {[
              { label: t.home.wins,    value: wins,          Icon: Trophy },
              { label: t.home.losses,  value: losses,        Icon: Swords },
              { label: t.home.winRate, value: `${winRate}%`, Icon: TrendingUp },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-4">
                <Icon size={14} className="text-[#8C7A5B]" />
                <span className="display text-2xl">{value}</span>
                <span className="eyebrow">{label}</span>
              </div>
            ))}
          </div>

          {streak >= 2 && (
            <Link
              href="/matches/new"
              className="mt-4 flex items-center gap-3 bg-[#14110F] px-4 py-3.5 cursor-pointer group"
            >
              <div className="flex-shrink-0 w-11 h-11 border border-[#FAF8F3]/30 flex flex-col items-center justify-center">
                <span className="display-upright text-[#FAF8F3] text-lg leading-none">{streak}</span>
                <Flame size={10} className="text-[#FAF8F3]/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#FAF8F3] font-semibold text-sm leading-snug">
                  {t.home.streak.replace("{n}", String(streak))}
                </p>
                <p className="text-[#FAF8F3]/60 text-xs font-medium mt-0.5">{t.home.streakHint}</p>
              </div>
              <ChevronRight size={16} className="text-[#FAF8F3]/60 group-hover:text-[#FAF8F3] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          )}
        </div>

        {/* ── Active match ── */}
        {activeMatch && (
          <div className="border border-[#14110F] p-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14110F] animate-pulse" />
                <span className="eyebrow">{t.home.liveMatch}</span>
              </div>
              <span className="eyebrow capitalize">
                {(activeMatch.game_types as unknown as { name: string } | null)?.name?.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="w-10 h-10 border border-[#14110F] bg-[#14110F] flex items-center justify-center display-upright text-[#FAF8F3] text-sm mb-1 mx-auto">
                  {initials}
                </div>
                <p className="text-xs font-semibold">{t.home.you}</p>
              </div>
              <span className="display italic text-xl text-[#8C7A5B]">vs</span>
              <div className="text-center">
                <div className="w-10 h-10 border border-[#E3DCCB] flex items-center justify-center display-upright text-sm mb-1 mx-auto">
                  {((activeMatch.opponent as unknown as { username: string } | null)?.username ??
                    (activeMatch.challenger as unknown as { username: string } | null)?.username ??
                    "??").slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs font-semibold">
                  {(activeMatch.opponent as unknown as { username: string } | null)?.username ??
                    (activeMatch.challenger as unknown as { username: string } | null)?.username ??
                    "Opponent"}
                </p>
              </div>
            </div>
            <Link
              href={`/matches/${activeMatch.id}`}
              className="mt-4 w-full h-11 flex items-center justify-center btn-gold text-sm cursor-pointer"
            >
              {t.home.goToMatch}
            </Link>
          </div>
        )}

        {/* ── Active event ── */}
        {activeEvent && (
          <Link
            href={`/events/${activeEvent.id}`}
            className="flex items-center gap-3 border border-[#14110F] p-4 mb-8 hover:bg-[#14110F] hover:text-[#FAF8F3] transition-colors cursor-pointer group"
          >
            <Zap size={16} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="eyebrow mb-0.5 group-hover:text-[#FAF8F3]/60">Active Event</p>
              <p className="font-semibold text-sm truncate">{activeEvent.name}</p>
            </div>
            <ChevronRight size={14} className="flex-shrink-0" />
          </Link>
        )}

        {/* ── Pending direct challenges ── */}
        {pendingChallenges && pendingChallenges.length > 0 && (
          <div className="mb-8">
            <p className="eyebrow mb-3">Challenges for you</p>
            <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
              {(pendingChallenges as unknown as Array<{
                id: string;
                game_types: { name: string } | null;
                challenger: { username: string } | null;
              }>).map((m) => (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="flex items-center gap-3 py-3 hover:opacity-60 transition-opacity cursor-pointer"
                >
                  <Swords size={14} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {m.challenger?.username ?? "?"} challenged you
                    </p>
                    <p className="text-xs text-[#8C7A5B] font-medium capitalize">
                      {m.game_types?.name?.replace("_", " ")}
                    </p>
                  </div>
                  <span className="link-arrow text-xs flex-shrink-0">Accept</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── City nudge ── */}
        {!hasCity && (
          <Link
            href="/profile"
            className="flex items-center gap-3 border border-[#14110F] p-4 mb-8 hover:bg-[#14110F] hover:text-[#FAF8F3] transition-colors cursor-pointer card-hover group"
          >
            <MapPin size={16} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.home.setCity}</p>
              <p className="text-xs text-[#8C7A5B] font-medium group-hover:text-[#FAF8F3]/60">{t.home.setCityHint}</p>
            </div>
            <ChevronRight size={14} className="flex-shrink-0" />
          </Link>
        )}

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/matches/new"
            className="btn-gold p-4 flex items-center gap-3 text-sm cursor-pointer"
          >
            <Swords size={18} />
            <span className="font-semibold">{t.home.findBattle}</span>
          </Link>
          <Link
            href="/crews"
            className="btn-outline p-4 flex items-center gap-3 text-sm cursor-pointer"
          >
            <Users size={18} />
            <span className="font-semibold">{t.home.myCrew}</span>
          </Link>
        </div>

        {/* ── Recent matches ── */}
        {allCompleted.length > 0 && (
          <div>
            <p className="eyebrow mb-3">{t.home.recentBattles}</p>
            <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
              {allCompleted.map((match) => {
                const isWin = match.winner_id === user.id;
                const opponentName = match.challenger_id === user.id
                  ? match.opponent?.username
                  : match.challenger?.username;
                return (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="flex items-center gap-3 py-3 hover:opacity-60 transition-opacity cursor-pointer"
                  >
                    <div className={`w-8 h-8 border flex items-center justify-center display-upright text-xs flex-shrink-0 ${
                      isWin
                        ? "border-[#14110F] bg-[#14110F] text-[#FAF8F3]"
                        : "border-[#E3DCCB] text-[#8C7A5B]"
                    }`}>
                      {isWin ? "W" : "L"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.profile.vs} {opponentName ?? "Unknown"}</p>
                      <p className="text-xs text-[#8C7A5B] font-medium capitalize">{match.game_types?.name?.replace("_", " ")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Clock size={11} className="text-[#8C7A5B]" />
                      <span className="text-xs text-[#8C7A5B] font-medium">
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
          <div className="text-center py-16 border-t border-b border-[#14110F]">
            <p className="display italic text-2xl mb-3">{t.home.noBattles}</p>
            <Link href="/matches/new" className="link-arrow text-sm">
              {t.home.startFirst}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}