"use client";

/**
 * Crews — create or join a crew via invite code, manage members
 * and start crew-vs-crew battles against nearby crews.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Crown, Copy, Plus, LogIn, Swords, Check, AlertCircle, Shield, Loader2, Trophy } from "lucide-react";
import { createCrew, joinCrew } from "@/app/actions/crews";
import { createClient } from "@/lib/supabase/client";
import { fuzzCoords } from "@/lib/geo";
import { copyToClipboard } from "@/lib/browser";
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

const STATUS_BADGE: Record<string, string> = {
  active: "border-emerald-600 text-emerald-700",
  open: "border-sky-600 text-sky-700",
  completed: "border-[#E3DCCB] text-[#6B5D42]",
  cancelled: "border-rose-600 text-rose-700",
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
    await copyToClipboard(crew.invite_code);
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

  const inputClass = "w-full h-14 bg-transparent border border-[#14110F] px-4 text-[#14110F] placeholder:text-[#6B5D42] focus:outline-none text-sm font-medium";

  if (!crew) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col">
        <div className="mb-8">
          <p className="eyebrow mb-1">{t.crews.title}</p>
          <h1 className="display text-3xl">{t.crews.titleAccent}</h1>
          <p className="text-[#4A3F2C] text-sm font-medium mt-1">{t.crews.subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 max-h-48 border border-[#14110F] hover:bg-[#14110F] hover:text-[#FAF8F3] p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group"
          >
            <Plus size={28} className="text-amber-700 group-hover:text-[#FAF8F3]" />
            <div className="text-center">
              <p className="font-semibold text-base">{t.crews.createCrew}</p>
              <p className="text-[#4A3F2C] group-hover:text-[#FAF8F3]/60 text-sm font-medium">{t.crews.createHint}</p>
            </div>
          </button>

          <button
            onClick={() => setShowJoin(true)}
            className="flex-1 max-h-48 border border-violet-700 hover:bg-violet-700 hover:text-white p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group"
          >
            <LogIn size={26} className="text-violet-700 group-hover:text-white" />
            <div className="text-center">
              <p className="font-semibold text-base">{t.crews.joinCrew}</p>
              <p className="text-[#4A3F2C] group-hover:text-white/70 text-sm font-medium">{t.crews.joinHint}</p>
            </div>
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-[#14110F]/50 backdrop-blur-sm z-[60] flex items-end" onClick={() => { setShowCreate(false); setError(null); }}>
            <form onSubmit={handleCreate} className="w-full max-w-lg mx-auto bg-[#FAF8F3] border-t border-[#14110F] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-[#E3DCCB] mx-auto mb-6" />
              <p className="eyebrow mb-1">{t.crews.createModalTitle}</p>
              <h3 className="display text-2xl mb-1">{t.crews.createCrew}</h3>
              <p className="text-[#4A3F2C] text-sm font-medium mb-5">{t.crews.createModalHint}</p>
              <div className="flex flex-col gap-3 mb-4">
                <input type="text" placeholder={t.crews.crewNamePlaceholder} value={crewName} onChange={(e) => setCrewName(e.target.value)} required className={inputClass} />
                <input type="text" placeholder={t.crews.cityPlaceholder} value={crewCity} onChange={(e) => setCrewCity(e.target.value)} className={inputClass} />
              </div>
              {error && <div className="flex items-center gap-2 text-rose-700 text-sm mb-4 font-semibold"><AlertCircle size={14} />{error}</div>}
              <button type="submit" disabled={loading} className="w-full h-12 btn-gold flex items-center justify-center cursor-pointer">
                {loading ? t.crews.creating : t.crews.createBtn}
              </button>
            </form>
          </div>
        )}

        {/* Join modal */}
        {showJoin && (
          <div className="fixed inset-0 bg-[#14110F]/50 backdrop-blur-sm z-[60] flex items-end" onClick={() => { setShowJoin(false); setError(null); }}>
            <form onSubmit={handleJoin} className="w-full max-w-lg mx-auto bg-[#FAF8F3] border-t border-violet-700 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-[#E3DCCB] mx-auto mb-6" />
              <p className="eyebrow mb-1">{t.crews.joinModalTitle}</p>
              <h3 className="display text-2xl mb-1">{t.crews.joinCrew}</h3>
              <p className="text-[#4A3F2C] text-sm font-medium mb-5">{t.crews.joinModalHint}</p>
              <input
                type="text"
                placeholder={t.crews.codePlaceholder}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className={`${inputClass} tracking-widest font-display mb-4`}
              />
              {error && <div className="flex items-center gap-2 text-rose-700 text-sm mb-4 font-semibold"><AlertCircle size={14} />{error}</div>}
              <button type="submit" disabled={loading} className="w-full h-12 bg-violet-700 text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 hover:bg-violet-800">
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
      <p className="eyebrow mb-1">{t.crews.title}</p>
      <h1 className="display text-3xl mb-6">{t.crews.titleAccent}</h1>

      {/* Crew hero card */}
      <div className="bg-violet-700 text-white p-5 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="display text-2xl">{crew.name}</h2>
            {crew.city && <p className="text-violet-200 text-sm font-medium">{crew.city}</p>}
          </div>
          <div className="text-right">
            <p className="display text-4xl">{totalWins}</p>
            <p className="text-violet-200 text-xs font-bold uppercase tracking-wider">{t.crews.totalWins}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 border border-white/25 p-3">
            <p className="text-violet-200 text-xs font-bold mb-1">{t.crews.members}</p>
            <p className="font-bold flex items-center gap-2">
              <Users size={14} />
              {members.length}
            </p>
          </div>
          <div className="flex-1 border border-white/25 p-3">
            <p className="text-violet-200 text-xs font-bold mb-1">{t.crewMatches.crewWins}</p>
            <p className="font-bold flex items-center gap-2">
              <Trophy size={14} />
              {crew.crew_wins}
            </p>
          </div>
          <div className="flex-1 border border-white/25 p-3">
            <p className="text-violet-200 text-xs font-bold mb-1">{t.crews.role}</p>
            <p className="font-bold flex items-center gap-2">
              <Shield size={14} />
              {crew.captain_id === currentUserId ? t.crews.captain : t.crews.member}
            </p>
          </div>
        </div>
      </div>

      {/* Invite code */}
      <div className="border border-[#14110F] p-4 mb-5">
        <p className="eyebrow mb-2">{t.crews.inviteCode}</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 display text-2xl text-amber-700 tracking-widest">{crew.invite_code}</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 border border-[#14110F] hover:bg-[#14110F] hover:text-[#FAF8F3] px-4 py-2 text-sm font-bold transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? t.common.copied : t.common.copy}
          </button>
        </div>
      </div>

      {/* Challenge another crew */}
      <button
        onClick={openChallengeModal}
        className="w-full bg-violet-700 hover:bg-violet-800 p-4 mb-5 flex items-center gap-4 transition-colors cursor-pointer"
      >
        <Swords size={20} className="text-white flex-shrink-0" />
        <div className="text-left">
          <p className="text-white font-bold text-sm">{t.crewMatches.challenge}</p>
          <p className="text-violet-200 text-xs font-medium">{t.crewMatches.challengeHint}</p>
        </div>
      </button>

      {/* Recent crew battles */}
      {recentBattles.length > 0 && (
        <div className="mb-5">
          <p className="eyebrow mb-3">{t.crewMatches.recentBattles}</p>
          <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
            {recentBattles.map((battle) => {
              const challengerName = (battle.challenger_crew as unknown as { name: string } | null)?.name ?? "?";
              const opponentName = (battle.opponent_crew as unknown as { name: string } | null)?.name ?? "?";
              const gameName = (battle.game_types as unknown as { name: string } | null)?.name?.replace(/_/g, " ") ?? "";
              const weWon = battle.winner_crew_id === crew!.id;
              const isDone = battle.status === "completed";
              return (
                <Link key={battle.id} href={`/crew-matches/${battle.id}`} className="flex items-center gap-3 py-3 hover:opacity-90 transition-opacity">
                  <div className={`w-9 h-9 border flex items-center justify-center flex-shrink-0 ${
                    isDone
                      ? weWon ? "border-emerald-700 bg-emerald-600" : "border-rose-700 bg-rose-50"
                      : "border-violet-700"
                  }`}>
                    {isDone
                      ? weWon ? <Trophy size={14} className="text-white" /> : <span className="text-xs font-bold text-rose-700">L</span>
                      : <Swords size={14} className="text-violet-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{challengerName} vs {opponentName}</p>
                    <p className="text-[#4A3F2C] text-xs font-medium capitalize">{gameName}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 capitalize flex-shrink-0 ${STATUS_BADGE[battle.status] ?? STATUS_BADGE.completed}`}>
                    {t.crewMatches.status[battle.status as keyof typeof t.crewMatches.status] ?? battle.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Members */}
      <p className="eyebrow mb-3">{t.crews.members}</p>
      <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 py-3">
            <div className={`w-10 h-10 flex items-center justify-center display-upright text-sm flex-shrink-0 ${
              member.role === "captain"
                ? "bg-[#14110F] text-[#FAF8F3]"
                : "border border-[#E3DCCB] text-[#4A3F2C]"
            }`}>
              {member.users?.username.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{member.users?.username ?? "Unknown"}</p>
                {member.role === "captain" && <Crown size={12} className="text-amber-600 flex-shrink-0" />}
              </div>
              <p className="text-[#4A3F2C] text-xs font-medium capitalize">{member.role === "captain" ? t.crews.captain : t.crews.member}</p>
            </div>
            <p className="text-emerald-700 text-sm font-bold flex-shrink-0">{member.users?.wins ?? 0}W</p>
          </div>
        ))}
      </div>

      {/* Challenge modal */}
      {showChallenge && (
        <div className="fixed inset-0 bg-[#14110F]/50 backdrop-blur-sm z-[60] flex items-end" onClick={() => { setShowChallenge(false); setChallengeError(null); }}>
          <form onSubmit={handleChallenge} className="w-full max-w-lg mx-auto bg-[#FAF8F3] border-t border-violet-700 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E3DCCB] mx-auto mb-6" />
            <p className="eyebrow mb-1">{t.crewMatches.title}</p>
            <h3 className="display text-2xl mb-1">{t.crewMatches.titleAccent}</h3>
            <p className="text-[#4A3F2C] text-sm font-medium mb-5">{t.crewMatches.challengeHint}</p>
            <p className="eyebrow mb-2">{t.crewMatches.chooseGame}</p>
            <div className="flex flex-col gap-2 mb-5">
              {gameTypes.map((gt) => (
                <button
                  key={gt.id}
                  type="button"
                  onClick={() => setSelectedGameType(gt.id)}
                  className={`h-12 border text-sm font-bold capitalize transition-colors cursor-pointer ${
                    selectedGameType === gt.id
                      ? "border-violet-700 bg-violet-700 text-white"
                      : "border-[#E3DCCB] text-[#4A3F2C] hover:border-violet-700"
                  }`}
                >
                  {gt.name.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            {challengeError && <div className="flex items-center gap-2 text-rose-700 text-sm mb-4 font-semibold"><AlertCircle size={14} />{challengeError}</div>}
            <button
              type="submit"
              disabled={challengePosting || !selectedGameType}
              className="w-full h-12 flex items-center justify-center gap-2 bg-violet-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-60 hover:bg-violet-800"
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
