"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Users, Swords, ChevronLeft, Share2, Trash2, Loader2 } from "lucide-react";
import { useT } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

type Event = {
  id: string;
  name: string;
  join_code: string;
  city: string | null;
  created_by: string;
};

type Member = {
  user_id: string;
  users: { username: string; wins: number; losses: number } | null;
};

type Battle = {
  id: string;
  created_at: string;
  winner_id: string | null;
  challenger_id: string;
  opponent_id: string | null;
  game_types: { name: string } | null;
  challenger: { username: string } | null;
  opponent: { username: string } | null;
};

export default function EventDetailPage() {
  const { id } = useParams() as { id: string };
  const t = useT();
  const router = useRouter();
  const supabase = createClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);

    const [{ data: ev }, { data: mems }, { data: matchData }] = await Promise.all([
      supabase.from("events").select("id, name, join_code, city, created_by").eq("id", id).single(),
      supabase.from("event_members").select("user_id, users(username, wins, losses)").eq("event_id", id),
      supabase
        .from("matches")
        .select("id, created_at, winner_id, challenger_id, opponent_id, game_types(name), challenger:challenger_id(username), opponent:opponent_id(username)")
        .eq("event_id", id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(20),
    ]);

    if (!ev) { setNotFound(true); return; }
    setEvent(ev);
    setMembers((mems ?? []) as unknown as Member[]);
    setBattles((matchData ?? []) as unknown as Battle[]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function copyCode() {
    if (!event) return;
    navigator.clipboard.writeText(event.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/events");
    } else {
      const data = await res.json() as { error?: string };
      setDeleteError(data.error ?? "Failed to delete");
      setDeleteConfirm(false);
    }
    setDeleting(false);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-stone-500 font-semibold">{t.events.notFound}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Build leaderboard: count wins per user within this event
  const winCounts: Record<string, number> = {};
  const matchCounts: Record<string, number> = {};
  for (const b of battles) {
    if (b.winner_id) winCounts[b.winner_id] = (winCounts[b.winner_id] ?? 0) + 1;
    if (b.challenger_id) matchCounts[b.challenger_id] = (matchCounts[b.challenger_id] ?? 0) + 1;
    if (b.opponent_id)   matchCounts[b.opponent_id]   = (matchCounts[b.opponent_id]   ?? 0) + 1;
  }
  const leaderboard = members
    .map((m) => ({
      user_id: m.user_id,
      username: m.users?.username ?? "?",
      eventWins: winCounts[m.user_id] ?? 0,
      eventMatches: matchCounts[m.user_id] ?? 0,
    }))
    .sort((a, b) => b.eventWins - a.eventWins || b.eventMatches - a.eventMatches);

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/events" className="w-9 h-9 rounded-xl bg-white border border-amber-100 flex items-center justify-center shadow-sm cursor-pointer">
          <ChevronLeft size={16} className="text-stone-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl text-stone-900 truncate">{event.name}</h1>
          {event.city && <p className="text-stone-400 text-xs font-semibold">{event.city}</p>}
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 hover:bg-amber-50 transition-colors cursor-pointer shadow-sm"
        >
          <Share2 size={12} className="text-amber-500" />
          {copied ? t.common.copied : event.join_code}
        </button>
      </div>

      {/* Code card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[10px] text-amber-600 uppercase tracking-widest font-bold mb-1">{t.events.eventCode}</p>
          <p className="font-display text-3xl text-amber-700 tracking-[0.3em]">{event.join_code}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400 font-semibold">{t.events.participants}</p>
          <p className="font-display text-2xl text-stone-700">{members.length}</p>
        </div>
      </div>

      {/* Leaderboard */}
      <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.events.topPlayers}</p>
      {leaderboard.length === 0 ? (
        <div className="bg-white border border-amber-100 rounded-2xl p-6 text-center mb-5 shadow-sm">
          <Swords size={32} className="text-stone-200 mx-auto mb-2" />
          <p className="text-stone-400 text-sm font-semibold">{t.events.noBattles}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-5">
          {leaderboard.map((p, i) => (
            <div
              key={p.user_id}
              className={`flex items-center gap-3 rounded-2xl p-3 border shadow-sm ${
                p.user_id === userId
                  ? "bg-amber-50 border-amber-300"
                  : "bg-white border-amber-100"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display text-sm flex-shrink-0 ${
                i === 0 ? "bg-amber-100 text-amber-600" :
                i === 1 ? "bg-stone-100 text-stone-600" :
                i === 2 ? "bg-orange-100 text-orange-600" : "bg-stone-50 text-stone-400"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-stone-800 text-sm font-bold truncate">{p.username}</p>
                <p className="text-stone-400 text-xs font-semibold">{p.eventMatches} {t.events.battles}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Trophy size={13} className="text-amber-500" />
                <span className="font-display text-base text-amber-600">{p.eventWins}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.events.participants} ({members.length})</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-1.5 bg-white border border-stone-100 rounded-xl px-3 py-1.5 shadow-sm">
            <Users size={11} className="text-stone-400" />
            <span className="text-stone-700 text-xs font-bold">{m.users?.username ?? "?"}</span>
          </div>
        ))}
      </div>

      {/* Recent battles */}
      {battles.length > 0 && (
        <>
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">{t.events.recentBattles}</p>
          <div className="flex flex-col gap-2">
            {battles.map((b) => {
              const isWin = b.winner_id === userId;
              const opponentName = b.challenger_id === userId
                ? b.opponent?.username
                : b.challenger?.username;
              return (
                <Link
                  key={b.id}
                  href={`/matches/${b.id}`}
                  className="flex items-center gap-3 bg-white border border-amber-100 hover:border-amber-300 rounded-2xl p-3 transition-all cursor-pointer shadow-sm"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display text-xs flex-shrink-0 ${
                    b.winner_id
                      ? (isWin ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-500 border border-rose-200")
                      : "bg-stone-100 text-stone-500"
                  }`}>
                    {b.winner_id ? (isWin ? "W" : "L") : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 text-sm font-bold truncate">
                      {b.challenger?.username} vs {b.opponent?.username ?? "?"}
                    </p>
                    <p className="text-stone-400 text-xs font-semibold capitalize">{b.game_types?.name?.replace("_", " ")}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
      {/* Delete event — creator only */}
      {event.created_by === userId && (
        <div className="mt-6 text-center">
          {deleteError && <p className="text-rose-600 text-xs mb-2 font-semibold">{deleteError}</p>}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
              deleteConfirm
                ? "text-rose-600 border-rose-300 bg-rose-50 hover:bg-rose-100"
                : "text-stone-400 border-stone-200 hover:text-stone-600 hover:border-stone-300"
            }`}
          >
            {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
            {deleting ? "Deleting…" : deleteConfirm ? "Confirm delete" : "Delete event"}
          </button>
        </div>
      )}
    </div>
  );
}
