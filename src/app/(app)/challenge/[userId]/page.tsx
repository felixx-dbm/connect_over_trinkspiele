"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Swords, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useT } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

type TargetUser = { username: string; city: string | null; wins: number; allow_direct_challenges: boolean };
type GameType = { id: string; name: string; team_size: number };

export default function ChallengePage() {
  const { userId } = useParams() as { userId: string };
  const t = useT();
  const router = useRouter();
  const [supabase] = useState(createClient);

  const [target, setTarget] = useState<TargetUser | null>(null);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [selfChallenge, setSelfChallenge] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const [authResult, { data: user }, { data: games }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("users").select("username, city, wins, allow_direct_challenges").eq("id", userId).single(),
        supabase.from("game_types").select("id, name, team_size").order("name"),
      ]);
      if (ignore) return;

      if (authResult.data.user?.id === userId) { setSelfChallenge(true); return; }
      if (!user || user.allow_direct_challenges === false) { setNotFound(true); return; }

      setTarget(user);
      setGameTypes(games ?? []);
      if (games && games.length > 0) setSelectedGame(games[0].id);
    }
    load();
    return () => { ignore = true; };
  }, [userId, supabase]);

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
        <p className="text-[#4A3F2C] font-medium">You can&apos;t challenge yourself.</p>
        <Link href="/home" className="link-arrow text-sm">Go home</Link>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-[#4A3F2C] font-medium">{t.challenge.notFound}</p>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#14110F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const targetInitials = target.username.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="w-9 h-9 border border-[#14110F] flex items-center justify-center cursor-pointer">
          <ChevronLeft size={16} />
        </Link>
        <div>
          <p className="eyebrow mb-0.5">{t.challenge.challengeTitle}</p>
          <h1 className="display text-2xl">{target.username.toUpperCase()}</h1>
        </div>
      </div>

      {/* Target profile card */}
      <div className="border border-[#14110F] p-5 mb-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-[#14110F] flex items-center justify-center display-upright text-[#FAF8F3] text-3xl">
            {targetInitials}
          </div>
          <div>
            <p className="display text-2xl">{target.username}</p>
            {target.city && <p className="text-[#6B5D42] text-xs font-medium mt-0.5">{target.city}</p>}
          </div>
          <div className="flex items-center gap-1.5 border border-amber-700 px-3 py-1.5">
            <span className="display text-lg text-amber-700">{target.wins}</span>
            <span className="text-[#6B5D42] text-xs font-medium">wins</span>
          </div>
        </div>
      </div>

      {/* Game picker */}
      <form onSubmit={handleSend}>
        <p className="eyebrow mb-3">{t.challenge.chooseGame}</p>
        <div className="flex flex-col gap-2 mb-6">
          {gameTypes.filter((g) => g.team_size === 1).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGame(g.id)}
              className={`flex items-center gap-3 p-4 border transition-colors cursor-pointer text-left ${
                selectedGame === g.id
                  ? "bg-amber-50 border-amber-700"
                  : "border-[#E3DCCB] hover:border-[#14110F]"
              }`}
            >
              <Swords size={14} className={selectedGame === g.id ? "text-amber-700" : "text-[#6B5D42]"} />
              <span className="font-bold text-sm capitalize">
                {g.name.replace("_", " ")}
              </span>
              {selectedGame === g.id && (
                <span className="ml-auto w-5 h-5 bg-amber-700 flex items-center justify-center text-white text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-rose-700 text-xs font-semibold mb-3">{error}</p>}

        <button
          type="submit"
          disabled={!selectedGame || sending}
          className="w-full h-14 btn-gold font-bold text-base disabled:opacity-50 cursor-pointer"
        >
          {sending ? t.challenge.sending : t.challenge.send}
        </button>
      </form>
    </div>
  );
}
