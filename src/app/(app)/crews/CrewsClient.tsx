"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Crown, Copy, Plus, LogIn, Swords, Check, AlertCircle, Shield } from "lucide-react";
import { createCrew, joinCrew } from "@/app/actions/crews";

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

  if (!crew) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col">
        <h1 className="font-display text-xl text-zinc-100 mb-2">
          MY <span className="text-amber-400">CREW</span>
        </h1>
        <p className="text-zinc-500 text-sm mb-10">Join forces with friends to battle crews</p>

        <div className="flex flex-col gap-4 flex-1">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 max-h-48 bg-amber-500/10 border-2 border-dashed border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/15 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-all">
              <Plus size={24} className="text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-zinc-200 font-semibold">Create a Crew</p>
              <p className="text-zinc-500 text-sm">Start your own team</p>
            </div>
          </button>

          <button
            onClick={() => setShowJoin(true)}
            className="flex-1 max-h-48 bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-zinc-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-all">
              <LogIn size={24} className="text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-zinc-200 font-semibold">Join a Crew</p>
              <p className="text-zinc-500 text-sm">Enter an invite code</p>
            </div>
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end" onClick={() => { setShowCreate(false); setError(null); }}>
            <form onSubmit={handleCreate} className="w-full max-w-lg mx-auto bg-zinc-900 border border-zinc-800 rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
              <h3 className="font-display text-lg text-zinc-100 mb-1">Create a Crew</h3>
              <p className="text-zinc-500 text-sm mb-5">Your crew&apos;s invite code is auto-generated</p>
              <div className="flex flex-col gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Crew name"
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  required
                  className="w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 text-sm"
                />
                <input
                  type="text"
                  placeholder="City (optional)"
                  value={crewCity}
                  onChange={(e) => setCrewCity(e.target.value)}
                  className="w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 text-sm"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full h-12 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold rounded-xl transition-all cursor-pointer">
                {loading ? "Creating…" : "Create Crew"}
              </button>
            </form>
          </div>
        )}

        {/* Join modal */}
        {showJoin && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end" onClick={() => { setShowJoin(false); setError(null); }}>
            <form onSubmit={handleJoin} className="w-full max-w-lg mx-auto bg-zinc-900 border border-zinc-800 rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
              <h3 className="font-display text-lg text-zinc-100 mb-1">Join a Crew</h3>
              <p className="text-zinc-500 text-sm mb-5">Enter the invite code your captain shared</p>
              <input
                type="text"
                placeholder="e.g. BIER-4821"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 text-sm font-display tracking-widest mb-4"
              />
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full h-12 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
                <LogIn size={16} />
                {loading ? "Joining…" : "Join Crew"}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <h1 className="font-display text-xl text-zinc-100 mb-6">
        MY <span className="text-amber-400">CREW</span>
      </h1>

      {/* Crew card */}
      <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-5 mb-5 amber-glow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl text-zinc-100">{crew.name}</h2>
            {crew.city && <p className="text-zinc-500 text-sm">{crew.city}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-amber-400">{totalWins}</p>
            <p className="text-zinc-600 text-xs">Total Wins</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-800 rounded-xl p-3">
            <p className="text-zinc-500 text-xs mb-1">Members</p>
            <p className="text-zinc-200 font-semibold flex items-center gap-2">
              <Users size={14} className="text-amber-400" />
              {members.length}
            </p>
          </div>
          <div className="flex-1 bg-zinc-800 rounded-xl p-3">
            <p className="text-zinc-500 text-xs mb-1">Role</p>
            <p className="text-zinc-200 font-semibold flex items-center gap-2">
              <Shield size={14} className="text-amber-400" />
              {crew.captain_id === currentUserId ? "Captain" : "Member"}
            </p>
          </div>
        </div>
      </div>

      {/* Invite code */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Invite Code</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 font-display text-xl text-amber-400 tracking-widest">{crew.invite_code}</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm text-zinc-300 transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <Link
        href="/matches/new"
        className="w-full h-12 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-sm rounded-2xl transition-all active:scale-[0.98] cursor-pointer amber-glow mb-5"
      >
        <Swords size={16} />
        Challenge Another Crew
      </Link>

      {/* Members */}
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Members</p>
      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-sm flex-shrink-0 ${
              member.role === "captain"
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                : "bg-zinc-800 text-zinc-400"
            }`}>
              {member.users?.username.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-zinc-200 text-sm font-medium truncate">{member.users?.username ?? "Unknown"}</p>
                {member.role === "captain" && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
              </div>
              <p className="text-zinc-600 text-xs capitalize">{member.role}</p>
            </div>
            <p className="text-zinc-400 text-sm font-medium flex-shrink-0">{member.users?.wins ?? 0}W</p>
          </div>
        ))}
      </div>
    </div>
  );
}
