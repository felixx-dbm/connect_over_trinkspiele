"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Crown, Copy, Plus, LogIn, Swords, Check, AlertCircle, Shield, Loader2, Trophy } from "lucide-react";
import { createCrew, joinCrew } from "@/app/actions/crews";
import { createClient } from "@/lib/supabase/client";
import { fuzzCoords } from "@/lib/geo";
import { useT } from "@/components/LanguageProvider";

type Member = {
  id: string;
  user_id: string;
  role: string;
  users: { username: string; wins: number } | null;
};

type Crew = {
  id: string;
  name: string;
  city: string | null;
  invite_code: string;
  captain_id: string;
  crew_wins: number;
};

type GameType = { id: string; name: string };

type RecentCrewMatch = {
  id: string;
  status: string;
  winner_crew_id: string | null;
  challenger_crew: { name: string } | null;
  opponent_crew: { name: string } | null;
  game_types: { name: string } | null;
};

type Props = {
  crew: Crew | null;
  members: Member[];
  totalWins: number;
  currentUserId: string;
};

export default function CrewsClient({ crew, members, totalWins, currentUserId }: Props) {
  const t = useT();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [crewName, setCrewName] = useState("");
  const [crewCity, setCrewCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [selectedGameType, setSelectedGameType] = useState<string>("");
  const [challengePosting, setChallengePosting] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [recentBattles, setRecentBattles] = useState<RecentCrewMatch[]>([]);

  useEffect(() => {
    if (!crew) return;
    const supabase = createClient();
    supabase
      .from("crew_matches")
      .select("id, status, winner_crew_id, challenger_crew:challenger_crew_id(name), opponent_crew:opponent_crew_id(name), game_types(name)")
      .or(`challenger_crew_id.eq.${crew.id},opponent_crew_id.eq.${crew.id}`)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentBattles(data as unknown as RecentCrewMatch[]);
      });
  }, [crew]);

  const openChallengeModal = async () => {
    if (gameTypes.length === 0) {
      const supabase = createClient();
      const { data } = await supabase.from("game_types").select("id, name").order("name");
      if (data) {
        setGameTypes(data);
        if (data.length > 0) setSelectedGameType(data[0].id);
      }
    }
    setShowChallenge(true);
  };

  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setChallengePosting(true);
    setChallengeError(null);

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

    const res = await fetch("/api/crew-matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_type_id: selectedGameType,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      }),
    });
    setChallengePosting(false);
    if (res.ok) {
      const data = await res.json() as { id: string };
      window.location.href = `/crew-matches/${data.id}`;
    } else {
      const data = await res.json() as { error?: string };
      setChallengeError(data.error ?? "Failed to create challenge");
    }
  };

  const copyCode = async () => {
    if (!crew) return;
    await navigator.clipboard.writeText(crew.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createCrew(crewName, crewCity);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setShowCreate(false);
    router.refresh();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await joinCrew(inviteCode);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setShowJoin(false);
    router.refresh();
  };

  const inputClass = "w-full h-14 bg-amber-50 border border-amber-200 rounded-2xl px-4 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-sm font-semibold";

  if (!crew) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col">
        <div className="mb-8">
          <h1 className="font-display text-xl text-stone-900 mb-1">
            {t.crews.title} <span className="text-gradient">{t.crews.titleAccent}</span>
          </h1>
          <p className="text-stone-500 text-sm font-semibold">{t.crews.subtitle}</p>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 max-h-48 bg-amber-50 border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-100/60 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/60 group-hover:scale-105 transition-transform">
              <Plus size={26} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-stone-800 font-extrabold text-base">{t.crews.createCrew}</p>
              <p className="text-stone-500 text-sm font-semibold">{t.crews.createHint}</p>
            </div>
          </button>

          <button
            onClick={() => setShowJoin(true)}
            className="flex-1 max-h-48 bg-white border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50/60 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200/60 group-hover:scale-105 transition-transform">
              <LogIn size={24} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-stone-800 font-extrabold text-base">{t.crews.joinCrew}</p>
              <p className="text-stone-500 text-sm font-semibold">{t.crews.joinHint}</p>
            </div>
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end" onClick={() => { setShowCreate(false); setError(null); }}>
            <form onSubmit={handleCreate} className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 border-t border-amber-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-6" />
              <div className="text-3xl mb-3">⚔️</div>
              <h3 className="font-display text-xl text-stone-900 mb-1">{t.crews.createModalTitle}</h3>
              <p className="text-stone-500 text-sm font-semibold mb-5">{t.crews.createModalHint}</p>
              <div className="flex flex-col gap-3 mb-4">
                <input type="text" placeholder={t.crews.crewNamePlaceholder} value={crewName} onChange={(e) => setCrewName(e.target.value)} required className={inputClass} />
                <input type="text" placeholder={t.crews.cityPlaceholder} value={crewCity} onChange={(e) => setCrewCity(e.target.value)} className={inputClass} />
              </div>
              {error && <div className="flex items-center gap-2 text-rose-600 text-sm mb-4 font-semibold"><AlertCircle size={14} />{error}</div>}
              <button type="submit" disabled={loading} className="w-full h-13 btn-gold rounded-2xl h-12 flex items-center justify-center cursor-pointer">
                {loading ? t.crews.creating : t.crews.createBtn}
              </button>
            </form>
          </div>
        )}

        {/* Join modal */}
        {showJoin && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end" onClick={() => { setShowJoin(false); setError(null); }}>
            <form onSubmit={handleJoin} className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 border-t border-amber-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-6" />
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-display text-xl text-stone-900 mb-1">{t.crews.joinModalTitle}</h3>
              <p className="text-stone-500 text-sm font-semibold mb-5">{t.crews.joinModalHint}</p>
              <input
                type="text"
                placeholder={t.crews.codePlaceholder}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className={`${inputClass} tracking-widest font-display mb-4`}
              />
              {error && <div className="flex items-center gap-2 text-rose-600 text-sm mb-4 font-semibold"><AlertCircle size={14} />{error}</div>}
              <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-violet-200/60 hover:shadow-violet-300/60">
                <LogIn size={16} />
                {loading ? t.crews.joining : t.crews.joinBtn}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <h1 className="font-display text-xl text-stone-900 mb-6">
        {t.crews.title} <span className="text-gradient">{t.crews.titleAccent}</span>
      </h1>

      {/* Crew hero card */}
      <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-5 mb-5 overflow-hidden shadow-xl shadow-amber-300/40">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/8 translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl text-white">{crew.name}</h2>
              {crew.city && <p className="text-amber-100 text-sm font-semibold">{crew.city}</p>}
            </div>
            <div className="text-right">
              <p className="font-display text-4xl text-white">{totalWins}</p>
              <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">{t.crews.totalWins}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/20 backdrop-blur rounded-2xl p-3">
              <p className="text-amber-100 text-xs font-bold mb-1">{t.crews.members}</p>
              <p className="text-white font-extrabold flex items-center gap-2">
                <Users size={14} />
                {members.length}
              </p>
            </div>
            <div className="flex-1 bg-white/20 backdrop-blur rounded-2xl p-3">
              <p className="text-amber-100 text-xs font-bold mb-1">{t.crewMatches.crewWins}</p>
              <p className="text-white font-extrabold flex items-center gap-2">
                <Trophy size={14} />
                {crew.crew_wins}
              </p>
            </div>
            <div className="flex-1 bg-white/20 backdrop-blur rounded-2xl p-3">
              <p className="text-amber-100 text-xs font-bold mb-1">{t.crews.role}</p>
              <p className="text-white font-extrabold flex items-center gap-2">
                <Shield size={14} />
                {crew.captain_id === currentUserId ? t.crews.captain : t.crews.member}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite code */}
      <div className="bg-white border border-amber-100 rounded-2xl p-4 mb-5 shadow-sm">
        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">{t.crews.inviteCode}</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 font-display text-2xl text-gradient-gold tracking-widest">{crew.invite_code}</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-4 py-2 rounded-xl text-sm font-bold text-amber-700 transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? t.common.copied : t.common.copy}
          </button>
        </div>
      </div>

      {/* Challenge another crew */}
      <button
        onClick={openChallengeModal}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 mb-5 flex items-center gap-4 shadow-lg shadow-violet-200/60 hover:shadow-violet-300/60 transition-all cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Swords size={20} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-white font-extrabold text-sm">{t.crewMatches.challenge}</p>
          <p className="text-violet-200 text-xs font-semibold">{t.crewMatches.challengeHint}</p>
        </div>
      </button>

      {/* Recent crew battles */}
      {recentBattles.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.crewMatches.recentBattles}</p>
          <div className="flex flex-col gap-2">
            {recentBattles.map((battle) => {
              const challengerName = (battle.challenger_crew as unknown as { name: string } | null)?.name ?? "?";
              const opponentName = (battle.opponent_crew as unknown as { name: string } | null)?.name ?? "?";
              const gameName = (battle.game_types as unknown as { name: string } | null)?.name?.replace(/_/g, " ") ?? "";
              const weWon = battle.winner_crew_id === crew!.id;
              const isDone = battle.status === "completed";
              return (
                <Link key={battle.id} href={`/crew-matches/${battle.id}`} className="flex items-center gap-3 bg-white border border-violet-100 rounded-2xl p-3 shadow-sm hover:border-violet-300 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDone
                      ? weWon ? "bg-gradient-to-br from-violet-400 to-purple-600" : "bg-rose-100 border border-rose-200"
                      : "bg-violet-50 border border-violet-200"
                  }`}>
                    {isDone
                      ? weWon ? <Trophy size={14} className="text-white" /> : <span className="text-xs font-bold text-rose-500">L</span>
                      : <Swords size={14} className="text-violet-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 text-sm font-bold truncate">{challengerName} vs {opponentName}</p>
                    <p className="text-stone-400 text-xs font-semibold capitalize">{gameName}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                    battle.status === "active" ? "bg-emerald-100 text-emerald-700" :
                    battle.status === "open" ? "bg-sky-100 text-sky-700" :
                    battle.status === "completed" ? "bg-stone-100 text-stone-500" :
                    "bg-rose-100 text-rose-600"
                  }`}>
                    {t.crewMatches.status[battle.status as keyof typeof t.crewMatches.status] ?? battle.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Members */}
      <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.crews.members}</p>
      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 bg-white border border-amber-100 rounded-2xl p-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-sm flex-shrink-0 ${
              member.role === "captain"
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200/50"
                : "bg-stone-100 border border-stone-200 text-stone-600"
            }`}>
              {member.users?.username.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-stone-800 text-sm font-bold truncate">{member.users?.username ?? "Unknown"}</p>
                {member.role === "captain" && <Crown size={12} className="text-amber-500 flex-shrink-0" />}
              </div>
              <p className="text-stone-400 text-xs font-semibold capitalize">{member.role === "captain" ? t.crews.captain : t.crews.member}</p>
            </div>
            <p className="text-stone-600 text-sm font-bold flex-shrink-0">{member.users?.wins ?? 0}W</p>
          </div>
        ))}
      </div>

      {/* Challenge modal */}
      {showChallenge && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end" onClick={() => { setShowChallenge(false); setChallengeError(null); }}>
          <form onSubmit={handleChallenge} className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 border-t border-violet-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-6" />
            <div className="text-3xl mb-3">⚔️</div>
            <h3 className="font-display text-xl text-stone-900 mb-1">{t.crewMatches.title} <span className="text-gradient">{t.crewMatches.titleAccent}</span></h3>
            <p className="text-stone-500 text-sm font-semibold mb-5">{t.crewMatches.challengeHint}</p>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-2">{t.crewMatches.chooseGame}</p>
            <div className="flex flex-col gap-2 mb-5">
              {gameTypes.map((gt) => (
                <button
                  key={gt.id}
                  type="button"
                  onClick={() => setSelectedGameType(gt.id)}
                  className={`h-12 rounded-2xl border-2 text-sm font-bold capitalize transition-all cursor-pointer ${
                    selectedGameType === gt.id
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-stone-200 bg-white text-stone-600 hover:border-violet-200"
                  }`}
                >
                  {gt.name.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            {challengeError && <div className="flex items-center gap-2 text-rose-600 text-sm mb-4 font-semibold"><AlertCircle size={14} />{challengeError}</div>}
            <button
              type="submit"
              disabled={challengePosting || !selectedGameType}
              className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl cursor-pointer disabled:opacity-60 shadow-lg shadow-violet-200/60"
            >
              {challengePosting ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
              {challengePosting ? t.crewMatches.posting : t.crewMatches.postChallenge}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
