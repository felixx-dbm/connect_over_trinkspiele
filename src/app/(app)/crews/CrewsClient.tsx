"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Crown, Copy, Plus, LogIn, Swords, Check, AlertCircle, Shield } from "lucide-react";
import { createCrew, joinCrew } from "@/app/actions/crews";
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
  const [inviteCode, setInviteCode] = useState("");
  const [crewName, setCrewName] = useState("");
  const [crewCity, setCrewCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end" onClick={() => { setShowCreate(false); setError(null); }}>
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end" onClick={() => { setShowJoin(false); setError(null); }}>
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

      {/* Coming soon */}
      <div className="bg-violet-50 border border-dashed border-violet-200 rounded-2xl p-5 mb-5 text-center">
        <Swords size={22} className="text-violet-400 mx-auto mb-2" />
        <p className="text-violet-700 font-bold text-sm mb-1">{t.crews.crewBattles}</p>
        <p className="text-violet-500 text-xs leading-relaxed font-semibold">{t.crews.crewBattlesHint}</p>
      </div>

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
    </div>
  );
}
