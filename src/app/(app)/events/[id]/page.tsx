"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Users, Swords, ChevronLeft, Share2, Trash2, Loader2 } from "lucide-react";
import { useT } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { copyToClipboard } from "@/lib/browser";

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
  const [supabase] = useState(createClient);

  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (ignore) return;
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
      if (ignore) return;

      if (!ev) { setNotFound(true); return; }
      setEvent(ev);
      setMembers((mems ?? []) as unknown as Member[]);
      setBattles((matchData ?? []) as unknown as Battle[]);
    }
    load();
    return () => { ignore = true; };
  }, [id, supabase]);

  async function copyCode() {
    if (!event) return;
    await copyToClipboard(event.join_code);
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
        <p className="text-[#4A3F2C] font-medium">{t.events.notFound}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#14110F] border-t-transparent rounded-full animate-spin" />
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

  const RANK_COLOR = ["text-amber-600", "text-stone-500", "text-orange-700"];

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/events" className="w-9 h-9 border border-[#14110F] flex items-center justify-center cursor-pointer">
          <ChevronLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="display text-2xl truncate">{event.name}</h1>
          {event.city && <p className="text-[#4A3F2C] text-xs font-medium">{event.city}</p>}
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 border border-[#14110F] px-3 py-2 text-xs font-bold hover:bg-[#14110F] hover:text-[#FAF8F3] transition-colors cursor-pointer"
        >
          <Share2 size={12} />
          {copied ? t.common.copied : event.join_code}
        </button>
      </div>

      {/* Code card */}
      <div className="border border-[#14110F] p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">{t.events.eventCode}</p>
          <p className="display text-3xl text-amber-700 tracking-[0.3em]">{event.join_code}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#4A3F2C] font-medium">{t.events.participants}</p>
          <p className="display text-2xl">{members.length}</p>
        </div>
      </div>

      {/* Leaderboard */}
      <p className="eyebrow mb-3">{t.events.topPlayers}</p>
      {leaderboard.length === 0 ? (
        <div className="border border-[#14110F] p-6 text-center mb-5">
          <Swords size={28} className="text-[#E3DCCB] mx-auto mb-2" />
          <p className="text-[#4A3F2C] text-sm font-medium">{t.events.noBattles}</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F] mb-5">
          {leaderboard.map((p, i) => (
            <div
              key={p.user_id}
              className={`flex items-center gap-3 py-3 ${p.user_id === userId ? "bg-amber-50" : ""}`}
            >
              <div className={`w-8 h-8 flex items-center justify-center display-upright text-sm flex-shrink-0 ${
                i < 3 ? RANK_COLOR[i] : "text-[#4A3F2C]"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.username}</p>
                <p className="text-[#4A3F2C] text-xs font-medium">{p.eventMatches} {t.events.battles}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Trophy size={13} className="text-amber-600" />
                <span className="display text-base text-amber-700">{p.eventWins}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      <p className="eyebrow mb-3">{t.events.participants} ({members.length})</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-1.5 border border-[#E3DCCB] px-3 py-1.5">
            <Users size={11} className="text-[#4A3F2C]" />
            <span className="text-xs font-bold">{m.users?.username ?? "?"}</span>
          </div>
        ))}
      </div>

      {/* Recent battles */}
      {battles.length > 0 && (
        <>
          <p className="eyebrow mb-3">{t.events.recentBattles}</p>
          <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
            {battles.map((b) => {
              const isWin = b.winner_id === userId;
              return (
                <Link
                  key={b.id}
                  href={`/matches/${b.id}`}
                  className="flex items-center gap-3 py-3 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <div className={`w-8 h-8 border flex items-center justify-center display-upright text-xs flex-shrink-0 ${
                    b.winner_id
                      ? (isWin ? "border-emerald-700 bg-emerald-600 text-white" : "border-rose-700 text-rose-700")
                      : "border-[#E3DCCB] text-[#4A3F2C]"
                  }`}>
                    {b.winner_id ? (isWin ? "W" : "L") : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {b.challenger?.username} vs {b.opponent?.username ?? "?"}
                    </p>
                    <p className="text-[#4A3F2C] text-xs font-medium capitalize">{b.game_types?.name?.replace("_", " ")}</p>
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
          {deleteError && <p className="text-rose-700 text-xs mb-2 font-semibold">{deleteError}</p>}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`inline-flex items-center gap-2 text-xs px-4 py-2 border font-bold transition-colors cursor-pointer ${
              deleteConfirm
                ? "text-rose-700 border-rose-700 bg-rose-50 hover:bg-rose-100"
                : "text-[#4A3F2C] border-[#E3DCCB] hover:border-[#14110F] hover:text-[#14110F]"
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
