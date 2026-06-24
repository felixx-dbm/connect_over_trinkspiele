"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Swords, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useT } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

type TargetUser = { username: string; city: string | null; wins: number };
type GameType = { id: string; name: string; team_size: number };

export default function ChallengePage() {
  const { userId } = useParams() as { userId: string };
  const t = useT();
  const router = useRouter();
  const supabase = createClient();

  const [target, setTarget] = useState<TargetUser | null>(null);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [selfChallenge, setSelfChallenge] = useState(false);

  const load = useCallback(async () => {
    const [authResult, { data: user }, { data: games }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("users").select("username, city, wins").eq("id", userId).single(),
      supabase.from("game_types").select("id, name, team_size").order("name"),
    ]);

    if (authResult.data.user?.id === userId) { setSelfChallenge(true); return; }
    if (!user) { setNotFound(true); return; }

    setTarget(user);
    setGameTypes(games ?? []);
    if (games && games.length > 0) setSelectedGame(games[0].id);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGame) return;
    setSending(true);
    setError("");
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_type_id: selectedGame, direct_opponent_id: userId }),
    });
    const json = await res.json() as { id?: string; error?: string };
    setSending(false);
    if (!res.ok || !json.id) { setError(json.error ?? "Failed"); return; }
    router.push(`/matches/${json.id}`);
  }

  if (selfChallenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <div className="text-5xl">😅</div>
        <p className="text-stone-600 font-semibold">You can't challenge yourself.</p>
        <Link href="/home" className="text-amber-600 font-bold text-sm">Go home</Link>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-stone-500 font-semibold">{t.challenge.notFound}</p>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const targetInitials = target.username.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="w-9 h-9 rounded-xl bg-white border border-amber-100 flex items-center justify-center shadow-sm cursor-pointer">
          <ChevronLeft size={16} className="text-stone-500" />
        </Link>
        <h1 className="font-display text-xl text-stone-900">
          {t.challenge.challengeTitle} <span className="text-gradient">{target.username.toUpperCase()}</span>
        </h1>
      </div>

      {/* Target profile card */}
      <div className="relative bg-white border border-amber-200 rounded-3xl p-5 mb-6 overflow-hidden shadow-md shadow-amber-100/40 text-center">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-display text-white text-3xl shadow-lg shadow-amber-200/50">
            {targetInitials}
          </div>
          <div>
            <p className="font-display text-2xl text-stone-900">{target.username}</p>
            {target.city && <p className="text-stone-400 text-xs font-semibold mt-0.5">{target.city}</p>}
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
            <span className="font-display text-lg text-amber-600">{target.wins}</span>
            <span className="text-stone-400 text-xs font-semibold">wins</span>
          </div>
        </div>
      </div>

      {/* Game picker */}
      <form onSubmit={handleSend}>
        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.challenge.chooseGame}</p>
        <div className="flex flex-col gap-2 mb-6">
          {gameTypes.filter((g) => g.team_size === 1).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGame(g.id)}
              className={`flex items-center gap-3 rounded-2xl p-4 border transition-all cursor-pointer text-left ${
                selectedGame === g.id
                  ? "bg-amber-50 border-amber-400 shadow-sm"
                  : "bg-white border-stone-200 hover:border-amber-200"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedGame === g.id ? "bg-amber-100" : "bg-stone-100"
              }`}>
                <Swords size={14} className={selectedGame === g.id ? "text-amber-600" : "text-stone-400"} />
              </div>
              <span className={`font-bold text-sm capitalize ${selectedGame === g.id ? "text-stone-900" : "text-stone-600"}`}>
                {g.name.replace("_", " ")}
              </span>
              {selectedGame === g.id && (
                <span className="ml-auto w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-rose-500 text-xs font-semibold mb-3">{error}</p>}

        <button
          type="submit"
          disabled={!selectedGame || sending}
          className="w-full h-14 btn-gold rounded-2xl font-bold text-base disabled:opacity-50 cursor-pointer"
        >
          {sending ? t.challenge.sending : t.challenge.send}
        </button>
      </form>
    </div>
  );
}
