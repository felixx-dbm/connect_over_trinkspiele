"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Navigation, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fuzzCoords } from "@/lib/geo";
import { useT } from "@/components/LanguageProvider";

type GameType = { id: string; name: string };

const GAME_STYLE: Record<string, { emoji: string; color: string; border: string; activeColor: string }> = {
  beer_pong:  { emoji: "🏓", color: "bg-amber-50",   border: "border-amber-200",  activeColor: "bg-amber-100 border-amber-500" },
  flunky_ball:{ emoji: "⚽", color: "bg-emerald-50", border: "border-emerald-200", activeColor: "bg-emerald-100 border-emerald-500" },
  freestyle:  { emoji: "🎲", color: "bg-violet-50",  border: "border-violet-200",  activeColor: "bg-violet-100 border-violet-500" },
};
const FALLBACK_STYLE = { emoji: "🍺", color: "bg-amber-50", border: "border-amber-200", activeColor: "bg-amber-100 border-amber-500" };

export default function NewMatchPage() {
  const t = useT();
  const router = useRouter();
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [gameTypeId, setGameTypeId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("game_types").select("id, name").then(({ data }) => {
      if (data) setGameTypes(data);
    });
  }, []);

  const handlePost = async () => {
    if (!gameTypeId) return;
    setPosting(true);
    setError(null);

    let coords: { lat: number; lng: number } | null = null;
    if (navigator.geolocation) {
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
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        game_type_id: gameTypeId,
        mode: "regional",
        status: "open",
        challenger_id: user?.id,
        challenger_type: "user",
        ...(coords ? { location: `POINT(${coords.lng} ${coords.lat})` } : {}),
      })
      .select("id")
      .single();

    setPosting(false);
    if (matchError) { setError(matchError.message); return; }
    router.push(`/matches/${match.id}`);
  };

  const selectedGame = gameTypes.find((g) => g.id === gameTypeId);

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

      <div className="flex flex-col gap-3 mb-8">
        {gameTypes.length === 0 && (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-amber-100 rounded-2xl animate-pulse shadow-sm" />
          ))
        )}
        {gameTypes.map((g) => {
          const style = GAME_STYLE[g.name] ?? FALLBACK_STYLE;
          const desc = (t.matches.gameDesc as Record<string, string>)[g.name] ?? "";
          const active = gameTypeId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setGameTypeId(g.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left shadow-sm ${
                active
                  ? style.activeColor + " shadow-md"
                  : style.color + " " + style.border + " hover:shadow-md"
              }`}
            >
              <span className="text-4xl select-none">{style.emoji}</span>
              <div className="flex-1">
                <p className={`font-extrabold text-sm ${active ? "text-stone-900" : "text-stone-700"}`}>
                  {g.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
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

      {/* Location info */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Navigation size={15} className="text-sky-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-stone-500 leading-relaxed font-semibold">
          {t.matches.locationNote}
        </p>
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
