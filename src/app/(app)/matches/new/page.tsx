"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Navigation, Users, Globe, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fuzzCoords } from "@/lib/geo";

type GameType = { id: string; name: string };

const MODE_CONFIG = [
  { id: "solo", name: "Solo", desc: "You vs a random opponent nearby", Icon: Navigation, geoRequired: true },
  { id: "crew", name: "Crew Battle", desc: "Challenge a specific crew", Icon: Users, geoRequired: false },
  { id: "regional", name: "Open Challenge", desc: "Post publicly on the map", Icon: Globe, geoRequired: true },
] as const;

const GAME_ICONS: Record<string, string> = {
  beer_pong: "🏓",
  flunky_ball: "⚽",
  freestyle: "🎲",
};

export default function NewMatchPage() {
  const router = useRouter();
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [gameTypeId, setGameTypeId] = useState<string | null>(null);
  const [mode, setMode] = useState<"solo" | "crew" | "regional" | null>(null);
  const [finding, setFinding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("game_types").select("id, name").then(({ data }) => {
      if (data) setGameTypes(data);
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (!finding || mode !== "solo") { setElapsed(0); return; }
    let secs = 0;
    const t = setInterval(() => {
      secs += 1;
      setElapsed(secs);
      if (secs >= 120) {
        clearInterval(t);
        if (pollRef.current) clearInterval(pollRef.current);
        fetch("/api/matchmaking/status", { method: "DELETE" }).catch(() => {});
        setFinding(false);
        setTimedOut(true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [finding, mode]);

  const selectedMode = MODE_CONFIG.find((m) => m.id === mode);
  const canProceed = gameTypeId && mode;

  const getLocation = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(fuzzCoords(pos.coords.latitude, pos.coords.longitude)),
        () => resolve(null),
        { timeout: 8000 }
      );
    });

  const handleStart = async () => {
    if (!canProceed) return;
    setFinding(true);
    setError(null);

    let coords: { lat: number; lng: number } | null = null;
    if (selectedMode?.geoRequired) {
      coords = await getLocation();
    }

    if (mode === "solo") {
      // Poll matchmaking every 5 s
      const poll = async () => {
        const params = new URLSearchParams({ game_type_id: gameTypeId! });
        if (coords) {
          params.set("lat", String(coords.lat));
          params.set("lng", String(coords.lng));
        }
        const res = await fetch(`/api/matchmaking/status?${params}`);
        const data = await res.json() as { status: string; matchId?: string };
        if (data.status === "matched" && data.matchId) {
          if (pollRef.current) clearInterval(pollRef.current);
          router.push(`/matches/${data.matchId}`);
        }
      };

      setTimedOut(false);
      await poll();
      pollRef.current = setInterval(poll, 5000);
    } else {
      // Regional / crew — create open match directly
      const supabase = createClient();
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          game_type_id: gameTypeId,
          mode,
          status: "open",
          challenger_id: (await supabase.auth.getUser()).data.user?.id,
          challenger_type: "user",
          ...(coords ? { location: `POINT(${coords.lng} ${coords.lat})` } : {}),
        })
        .select("id")
        .single();

      setFinding(false);
      if (matchError) { setError(matchError.message); return; }
      router.push(`/matches/${match.id}`);
    }
  };

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

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

      {/* Game type */}
      <div className="mb-7">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">1. Choose Game</p>
        <div className="flex flex-col gap-2">
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
              <div className="flex-1">
                <p className={`font-semibold text-sm ${gameTypeId === g.id ? "text-amber-300" : "text-zinc-200"}`}>
                  {g.name.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
              {gameTypeId === g.id && (
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-zinc-950" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="mb-7">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">2. Choose Mode</p>
        <div className="flex flex-col gap-2">
          {MODE_CONFIG.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                mode === m.id
                  ? "bg-amber-500/10 border-amber-500/40 amber-glow-sm"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${mode === m.id ? "bg-amber-500/20" : "bg-zinc-800"}`}>
                <m.Icon size={18} className={mode === m.id ? "text-amber-400" : "text-zinc-400"} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${mode === m.id ? "text-amber-300" : "text-zinc-200"}`}>{m.name}</p>
                  {m.geoRequired && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full border border-zinc-700">GPS</span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs">{m.desc}</p>
              </div>
              {mode === m.id && (
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-zinc-950" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedMode?.geoRequired && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-6 flex items-start gap-3">
          <Navigation size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Your location will be requested. Coordinates are fuzzed to ±200 m for privacy.
          </p>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {timedOut && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-4 text-center">
          <p className="text-zinc-300 font-semibold mb-1">No one nearby right now</p>
          <p className="text-zinc-500 text-sm mt-1">Try a different game type, or post an Open Challenge so others can find you on the map.</p>
          <button
            onClick={() => setTimedOut(false)}
            className="mt-4 text-sm text-amber-400 hover:text-amber-300 underline cursor-pointer transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {finding && mode === "solo" && (
        <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-6 mb-4 text-center">
          <Loader2 size={32} className="text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-zinc-200 font-semibold">Finding opponent…</p>
          <p className="text-zinc-500 text-sm mt-1">
            {elapsed < 30
              ? "Checking nearby players every 5s"
              : elapsed < 60
              ? "No one nearby yet — still searching…"
              : `Still searching · ${120 - elapsed}s before timeout`}
          </p>
          {elapsed >= 30 && (
            <div className="mt-3 w-full bg-zinc-800 rounded-full h-1">
              <div
                className="bg-amber-500 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((elapsed / 120) * 100, 100)}%` }}
              />
            </div>
          )}
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setFinding(false);
              fetch("/api/matchmaking/status", { method: "DELETE" }).catch(() => {});
            }}
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 underline cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {!finding && (
        <button
          onClick={handleStart}
          disabled={!canProceed}
          className={`w-full h-14 flex items-center justify-center gap-3 font-bold text-base rounded-2xl transition-all duration-200 cursor-pointer ${
            canProceed
              ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 active:scale-[0.98] amber-glow"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {mode === "solo" ? "Find Opponent" : mode === "crew" ? "Send Challenge" : "Post to Map"}
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
