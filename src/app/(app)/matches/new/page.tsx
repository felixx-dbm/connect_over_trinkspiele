"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Navigation, ChevronRight, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fuzzCoords } from "@/lib/geo";
import { useT } from "@/components/LanguageProvider";
import { containsSlur } from "@/lib/filter";

type GameType = { id: string; name: string; team_size: number };

const GAME_STYLE: Record<string, { emoji: string; color: string; border: string; activeColor: string }> = {
  beer_pong:   { emoji: "🏓", color: "bg-amber-50",   border: "border-amber-200",  activeColor: "bg-amber-100 border-amber-500" },
  flunky_ball: { emoji: "⚽", color: "bg-emerald-50", border: "border-emerald-200", activeColor: "bg-emerald-100 border-emerald-500" },
  freestyle:   { emoji: "🎲", color: "bg-violet-50",  border: "border-violet-200",  activeColor: "bg-violet-100 border-violet-500" },
};
const FALLBACK_STYLE = { emoji: "🍺", color: "bg-amber-50", border: "border-amber-200", activeColor: "bg-amber-100 border-amber-500" };

const BEER_PONG_SIZES  = [1, 2, 3];
const FLUNKY_SIZES     = [3, 10];
const FREESTYLE_SIZES  = [1, 2, 3, 4];

export default function NewMatchPage() {
  const t = useT();
  const router = useRouter();
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [gameTypeId, setGameTypeId] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number>(1);
  const [meetingHint, setMeetingHint] = useState("");
  const [customGameName, setCustomGameName] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLocation, setShareLocation] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const userId = data.user.id;

      // Redirect to existing live match if one exists
      const { data: live } = await supabase
        .from("matches")
        .select("id")
        .eq("challenger_id", userId)
        .in("status", ["open", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (live) { router.replace(`/matches/${live.id}`); return; }

      const { data: priv } = await supabase
        .from("users").select("share_location").eq("id", userId).single();
      const p = priv as { share_location?: boolean } | null;
      if (p && p.share_location === false) setShareLocation(false);
    });

    supabase.from("game_types").select("id, name, team_size").then(({ data }) => {
      if (data) setGameTypes(data);
    });
  }, [router]);

  const selectedGame = gameTypes.find((g) => g.id === gameTypeId);
  const isBeerPong  = selectedGame?.name === "beer_pong";
  const isFlunkyBall = selectedGame?.name === "flunky_ball";
  const isFreestyle  = selectedGame?.name === "freestyle";

  // Reset team size to a sensible default when game changes
  useEffect(() => {
    if (isBeerPong)   setTeamSize(2);
    else if (isFlunkyBall) setTeamSize(10);
    else              setTeamSize(1);
  }, [gameTypeId, isBeerPong, isFlunkyBall]);

  const teamSizeOptions: number[] | null =
    isBeerPong   ? BEER_PONG_SIZES  :
    isFlunkyBall ? FLUNKY_SIZES     :
    isFreestyle  ? FREESTYLE_SIZES  :
    null;

  // Open lobby: flunky always, freestyle when teamSize > 1
  const isOpenLobby = isFlunkyBall || (isFreestyle && teamSize > 1);

  const handlePost = async () => {
    if (!gameTypeId) return;

    if (isFreestyle) {
      if (!customGameName.trim()) { setError(t.matches.customGameNameRequired); return; }
      if (containsSlur(customGameName)) { setError(t.matches.customGameNameSlur); return; }
    }

    setPosting(true);
    setError(null);

    const supabaseCheck = createClient();
    const { data: { user: checkUser } } = await supabaseCheck.auth.getUser();
    if (checkUser) {
      const { data: live } = await supabaseCheck
        .from("matches")
        .select("id")
        .eq("challenger_id", checkUser.id)
        .in("status", ["open", "active"])
        .limit(1)
        .maybeSingle();
      if (live) {
        setPosting(false);
        setError(t.matches.alreadyLive);
        router.push(`/matches/${live.id}`);
        return;
      }
    }

    let coords: { lat: number; lng: number } | null = null;
    if (shareLocation && navigator.geolocation) {
      coords = await new Promise((resolve) =>
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(fuzzCoords(pos.coords.latitude, pos.coords.longitude)),
          () => resolve(null),
          { timeout: 8000 }
        )
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPosting(false); setError("Not logged in"); return; }

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        game_type_id: gameTypeId,
        mode: "regional",
        status: "open",
        challenger_id: user.id,
        challenger_type: "user",
        team_size: teamSize,
        slots_challenger: teamSize > 1 ? 0 : 1,
        is_open_lobby: isOpenLobby,
        ...(isFreestyle && customGameName.trim() ? { custom_game_name: customGameName.trim() } : {}),
        ...(meetingHint.trim() ? { meeting_hint: meetingHint.trim() } : {}),
        ...(coords ? {
          location: `POINT(${coords.lng} ${coords.lat})`,
          fuzzy_lat: coords.lat,
          fuzzy_lng: coords.lng,
        } : {}),
      })
      .select("id")
      .single();

    setPosting(false);
    if (matchError) { setError(matchError.message); return; }

    if (teamSize > 1) {
      await supabase
        .from("match_members")
        .insert({ match_id: match.id, user_id: user.id, team: "challenger" });
    }

    router.push(`/matches/${match.id}`);
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="w-9 h-9 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-stone-500 hover:border-amber-300 transition-colors cursor-pointer shadow-sm">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl text-stone-900">
          {t.matches.newTitle} <span className="text-gradient">{t.matches.newAccent}</span>
        </h1>
      </div>

      <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.matches.chooseGame}</p>

      <div className="flex flex-col gap-3 mb-6">
        {gameTypes.length === 0 && (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-amber-100 rounded-2xl animate-pulse shadow-sm" />
          ))
        )}
        {gameTypes.map((g) => {
          const style = GAME_STYLE[g.name] ?? FALLBACK_STYLE;
          const desc = (t.matches.gameDesc as Record<string, string>)[g.name] ?? "";
          const active = gameTypeId === g.id;
          const isFlunky = g.name === "flunky_ball";
          const isFlexSize = g.name === "beer_pong" || g.name === "freestyle";
          return (
            <button
              key={g.id}
              onClick={() => { setGameTypeId(g.id); setError(null); }}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left shadow-sm ${
                active
                  ? style.activeColor + " shadow-md"
                  : style.color + " " + style.border + " hover:shadow-md"
              }`}
            >
              <span className="text-4xl select-none">{style.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-extrabold text-sm ${active ? "text-stone-900" : "text-stone-700"}`}>
                    {g.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  {isFlunky ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Users size={9} />{t.matches.openLobbyBadge}
                    </span>
                  ) : isFlexSize ? (
                    <span className="text-[10px] bg-stone-100 text-stone-500 border border-stone-200 px-1.5 py-0.5 rounded-full font-bold">
                      flexible
                    </span>
                  ) : null}
                </div>
                <p className="text-stone-500 text-xs font-semibold mt-0.5">{desc}</p>
              </div>
              {active && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-200/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Team size picker */}
      {teamSizeOptions && selectedGame && (
        <div className="mb-5">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.matches.teamSizeLabel}</p>
          <div className="flex gap-2">
            {teamSizeOptions.map((n) => (
              <button
                key={n}
                onClick={() => setTeamSize(n)}
                className={`flex-1 h-11 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  teamSize === n
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400 text-white shadow-md shadow-amber-200/50"
                    : "bg-white border-stone-200 text-stone-600 hover:border-amber-300"
                }`}
              >
                {n === 1 ? "1v1" : `${n}v${n}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Open lobby explanation: flunky always, freestyle when team > 1 */}
      {isFlunkyBall && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <Users size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-stone-600 leading-relaxed font-semibold">{t.matches.openLobbyHint}</p>
        </div>
      )}
      {isFreestyle && teamSize > 1 && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <Users size={15} className="text-violet-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-stone-600 leading-relaxed font-semibold">{t.matches.freestyleOpenLobbyHint}</p>
        </div>
      )}

      {/* Freestyle: custom game name */}
      {isFreestyle && (
        <div className="mb-4">
          <label className="text-xs text-stone-400 font-bold uppercase tracking-widest block mb-2">
            {t.matches.customGameNameLabel}
          </label>
          <input
            type="text"
            maxLength={50}
            value={customGameName}
            onChange={(e) => { setCustomGameName(e.target.value); setError(null); }}
            placeholder={t.matches.customGameNamePlaceholder}
            className="w-full h-12 px-4 bg-white border border-violet-200 rounded-2xl text-sm text-stone-800 font-semibold placeholder:text-stone-300 focus:outline-none focus:border-violet-400 transition-colors shadow-sm"
          />
        </div>
      )}

      {/* Location info */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
        <Navigation size={15} className="text-sky-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-stone-500 leading-relaxed font-semibold">
          {t.matches.locationNote}
        </p>
      </div>

      {/* Meeting hint */}
      <div className="mb-6">
        <label className="text-xs text-stone-400 font-bold uppercase tracking-widest block mb-2">
          {t.matches.meetingHintLabel}
        </label>
        <input
          type="text"
          maxLength={100}
          value={meetingHint}
          onChange={(e) => setMeetingHint(e.target.value)}
          placeholder={t.matches.meetingHintPlaceholder}
          className="w-full h-12 px-4 bg-white border border-amber-200 rounded-2xl text-sm text-stone-800 font-semibold placeholder:text-stone-300 focus:outline-none focus:border-amber-400 transition-colors shadow-sm"
        />
        <p className="text-xs text-stone-400 font-semibold mt-2 px-1">{t.matches.meetingHintNote}</p>
      </div>

      {error && (
        <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 mb-4 font-semibold">
          {error}
        </div>
      )}

      <button
        onClick={handlePost}
        disabled={!gameTypeId || posting}
        className={`w-full h-14 flex items-center justify-center gap-3 text-base rounded-2xl cursor-pointer ${
          gameTypeId && !posting
            ? "btn-gold"
            : "bg-amber-100 text-amber-400 cursor-not-allowed font-bold"
        }`}
      >
        {posting
          ? <Loader2 size={18} className="animate-spin" />
          : <ChevronRight size={18} />}
        {posting
          ? t.matches.posting
          : selectedGame
            ? t.matches.postChallenge.replace("{game}", selectedGame.name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
            : t.matches.postToMap}
      </button>
    </div>
  );
}
