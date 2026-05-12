"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Navigation, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fuzzCoords } from "@/lib/geo";

type GameType = { id: string; name: string };

const GAME_ICONS: Record<string, string> = {
  beer_pong: "🏓",
  flunky_ball: "⚽",
  freestyle: "🎲",
};

export default function NewMatchPage() {
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

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-xl text-zinc-100">
          NEW <span className="text-amber-400">BATTLE</span>
        </h1>
      </div>

      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Choose Game</p>
      <div className="flex flex-col gap-2 mb-8">
        {gameTypes.length === 0 && (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          ))
        )}
        {gameTypes.map((g) => (
          <button
            key={g.id}
            onClick={() => setGameTypeId(g.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
              gameTypeId === g.id
                ? "bg-amber-500/10 border-amber-500/40 amber-glow-sm"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <span className="text-2xl select-none">{GAME_ICONS[g.name] ?? "🎮"}</span>
            <p className={`flex-1 font-semibold text-sm ${gameTypeId === g.id ? "text-amber-300" : "text-zinc-200"}`}>
              {g.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            {gameTypeId === g.id && (
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-zinc-950" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-6 flex items-start gap-3">
        <Navigation size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-zinc-500 leading-relaxed">
          Your location will be requested so your challenge appears on the map. Coordinates are fuzzed to ±200 m for privacy.
        </p>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handlePost}
        disabled={!gameTypeId || posting}
        className={`w-full h-14 flex items-center justify-center gap-3 font-bold text-base rounded-2xl transition-all duration-200 cursor-pointer ${
          gameTypeId && !posting
            ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 active:scale-[0.98] amber-glow"
            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
        }`}
      >
        {posting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
        {posting ? "Posting…" : "Post to Map"}
      </button>
    </div>
  );
}
