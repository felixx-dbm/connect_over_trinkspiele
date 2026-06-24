"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Trophy, Swords, Loader2, Share2, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/LanguageProvider";

type Match = {
  id: string;
  status: "open" | "active" | "completed" | "cancelled";
  mode: string;
  winner_id: string | null;
  challenger_id: string;
  opponent_id: string | null;
  created_at: string;
  game_types: { name: string } | null;
  challenger: { username: string } | null;
  opponent: { username: string } | null;
};

const STATUS_STYLE = {
  open:      { color: "text-sky-600",     bg: "bg-sky-50 border-sky-200"     },
  active:    { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  completed: { color: "text-stone-500",   bg: "bg-stone-50 border-stone-200"  },
  cancelled: { color: "text-rose-600",    bg: "bg-rose-50 border-rose-200"    },
};

export default function MatchPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [opponentSubmittedFirst, setOpponentSubmittedFirst] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const prevOpponentId = useRef<string | null | undefined>(undefined);
  const prevStatus = useRef<string | undefined>(undefined);

  const fetchMatch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("matches")
      .select("id, status, mode, winner_id, challenger_id, opponent_id, created_at, game_types(name), challenger:challenger_id(username), opponent:opponent_id(username)")
      .eq("id", id)
      .single();
    if (data) setMatch(data as unknown as Match);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    fetchMatch();

    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("matches")
        .select("status, winner_id, opponent_id")
        .eq("id", id)
        .single();
      if (data) {
        if (prevOpponentId.current === null && data.opponent_id) {
          setOpponentJoined(true);
          setTimeout(() => setOpponentJoined(false), 3500);
        }
        prevOpponentId.current = data.opponent_id;
        if (prevStatus.current === "active" && data.status === "completed") setOpponentSubmittedFirst(true);
        prevStatus.current = data.status;
        setMatch((prev) => prev ? { ...prev, ...data } : prev);
        if (data.status === "completed" || data.status === "cancelled") clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, fetchMatch]);

  const shareMatch = async () => {
    const url = `${window.location.origin}/matches/${id}`;
    let usedShare = false;
    if (navigator.share) {
      try { await navigator.share({ title: "Join my battle!", url }); usedShare = true; } catch {}
    }
    if (!usedShare) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    setJoinError(null);
    const res = await fetch(`/api/matches/${id}/accept`, { method: "POST" });
    if (res.ok) { fetchMatch(); }
    else { const data = await res.json() as { error?: string }; setJoinError(data.error ?? "Failed to join match"); }
    setJoining(false);
  };

  const handleCancel = async () => {
    if (!cancelConfirm) { setCancelConfirm(true); return; }
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/matches/${id}/cancel`, { method: "POST" });
      if (res.ok) { router.push("/home"); }
      else { const data = await res.json() as { error?: string }; setCancelError(data.error ?? "Failed to cancel"); setCancelConfirm(false); }
    } catch { setCancelError("Network error — try again"); setCancelConfirm(false); }
    finally { setCancelling(false); }
  };

  const handleSubmit = async () => {
    if (!result || !match || !currentUserId) return;
    setSubmitting(true);
    setSubmitError(null);
    const winnerId = result === "win" ? currentUserId
      : (match.challenger_id === currentUserId ? match.opponent_id : match.challenger_id);
    const res = await fetch(`/api/matches/${id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winner_id: winnerId }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setMatch((prev) => prev ? { ...prev, status: "completed", winner_id: winnerId } : prev);
    } else if (res.status === 409) {
      await fetchMatch();
    } else {
      const data = await res.json() as { error?: string };
      setSubmitError(data.error ?? "Failed to submit result");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <div className="text-5xl mb-4">🤔</div>
          <p className="text-stone-500 font-semibold mb-4">{t.matches.notFound}</p>
          <Link href="/home" className="text-amber-600 font-bold hover:text-amber-700">← {t.matches.backHome}</Link>
        </div>
      </div>
    );
  }

  const challengerName   = match.challenger?.username ?? "Unknown";
  const opponentName     = match.opponent?.username ?? "Waiting…";
  const challengerInitials = challengerName.slice(0, 2).toUpperCase();
  const opponentInitials   = match.opponent ? opponentName.slice(0, 2).toUpperCase() : "?";
  const isChallenger = match.challenger_id === currentUserId;
  const isParticipant = currentUserId === match.challenger_id || currentUserId === match.opponent_id;
  const isWinner = match.winner_id === currentUserId;
  const winnerName = match.winner_id === match.challenger_id ? challengerName : opponentName;
  const statusStyle = STATUS_STYLE[match.status] ?? STATUS_STYLE.open;
  const statusLabel = t.matches.status[match.status] ?? match.status;

  if (submitted || match.status === "completed") {
    const gameLabel = match.game_types?.name?.replace(/_/g, " ") ?? "match";
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col items-center justify-center text-center gap-6">
        {opponentSubmittedFirst && !submitted && (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2 text-stone-500 text-xs font-semibold">
            {t.matches.opponentSubmittedFirst}
          </div>
        )}

        <div className={`w-28 h-28 rounded-3xl flex items-center justify-center ${
          !isParticipant
            ? "bg-stone-100 border-2 border-stone-200"
            : isWinner
            ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-300/50"
            : "bg-stone-100 border-2 border-stone-200"
        } animate-bounce-in`}>
          {!isParticipant
            ? <Trophy size={44} className="text-stone-400" />
            : isWinner
            ? <Trophy size={44} className="text-white" />
            : <XCircle size={44} className="text-stone-400" />}
        </div>

        <div>
          {!isParticipant ? (
            <>
              <h2 className="font-display text-3xl text-stone-900 mb-1">
                <span className="text-gradient">{winnerName.toUpperCase()}</span> {t.matches.wins}
              </h2>
              <p className="text-stone-500 text-sm font-semibold capitalize">{gameLabel}</p>
            </>
          ) : isWinner ? (
            <>
              <h2 className="font-display text-3xl text-stone-900 mb-1">
                {t.matches.youWin.split("WIN!")[0]}<span className="text-gradient">WIN!</span> 🎉
              </h2>
              <p className="text-stone-500 text-sm font-semibold">{t.matches.winRecord}</p>
            </>
          ) : match.winner_id ? (
            <>
              <h2 className="font-display text-3xl text-stone-900 mb-1">{t.matches.betterLuck}</h2>
              <p className="text-stone-500 text-sm font-semibold">
                {t.matches.tookThisOne.replace("{name}", winnerName)}
              </p>
            </>
          ) : (
            <h2 className="font-display text-3xl text-stone-900 mb-1">{t.matches.matchEnded}</h2>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/matches/new" className="h-13 px-8 btn-gold rounded-2xl flex items-center justify-center gap-2 cursor-pointer h-12">
            <RefreshCw size={16} /> {t.matches.rematch}
          </Link>
          <Link href="/home" className="h-12 px-8 bg-white border border-amber-200 hover:border-amber-400 text-stone-700 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
            <Swords size={16} className="text-amber-500" /> {t.matches.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="w-9 h-9 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-stone-500 hover:border-amber-300 transition-colors cursor-pointer shadow-sm">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl text-stone-900">
          {t.matches.lobbyTitle} <span className="text-gradient">{t.matches.lobbyAccent}</span>
        </h1>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-bold ${statusStyle.bg} ${statusStyle.color}`}>
          {match.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          {statusLabel}
        </span>
        <span className="text-xs bg-white border border-amber-100 px-3 py-1.5 rounded-full text-stone-600 font-bold capitalize shadow-sm">
          {match.game_types?.name?.replace(/_/g, " ")}
        </span>
        <span className="text-xs bg-white border border-amber-100 px-3 py-1.5 rounded-full text-stone-600 font-bold capitalize shadow-sm">
          {match.mode}
        </span>
      </div>

      {opponentJoined && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2 text-emerald-700 text-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          {t.matches.opponentJoined}
        </div>
      )}

      {/* VS card */}
      <div className="relative bg-white border border-amber-100 rounded-3xl p-6 mb-5 overflow-hidden shadow-md shadow-amber-100/40">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-orange-50/40 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-display text-lg shadow-md ${
              isChallenger
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-200/60"
                : "bg-stone-100 border border-stone-200 text-stone-600"
            }`}>
              {challengerInitials}
            </div>
            <p className="text-stone-800 font-bold text-sm text-center">{challengerName}</p>
            {isChallenger && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{t.matches.you}</span>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-2xl text-gradient">VS</span>
            <Swords size={16} className="text-stone-300" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-display text-lg shadow-md ${
              !isChallenger && match.opponent
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-200/60"
                : "bg-stone-100 border border-stone-200 text-stone-600"
            }`}>
              {opponentInitials}
            </div>
            <p className="text-stone-800 font-bold text-sm text-center">{opponentName}</p>
            {!isChallenger && match.opponent && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{t.matches.you}</span>}
          </div>
        </div>
      </div>

      {/* Match info */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-amber-100 rounded-2xl p-3 flex items-center gap-2 shadow-sm">
          <Clock size={14} className="text-amber-400" />
          <div>
            <p className="text-stone-400 text-xs font-bold">{t.matches.started}</p>
            <p className="text-stone-700 text-sm font-extrabold">
              {new Date(match.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="bg-white border border-amber-100 rounded-2xl p-3 flex items-center gap-2 shadow-sm">
          <MapPin size={14} className="text-amber-400" />
          <div>
            <p className="text-stone-400 text-xs font-bold">{t.matches.mode}</p>
            <p className="text-stone-700 text-sm font-extrabold capitalize">{match.mode}</p>
          </div>
        </div>
      </div>

      {/* Submit result (active match) */}
      {match.status === "active" && (
        <div>
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-2">{t.matches.submitResult}</p>
          <p className="text-stone-400 text-xs font-semibold mb-3">{t.matches.submitHint}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(["win", "loss"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setResult(r)}
                className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                  result === r
                    ? r === "win"
                      ? "bg-gradient-to-br from-emerald-400 to-green-500 border-emerald-400 text-white shadow-lg shadow-emerald-200/60"
                      : "bg-rose-50 border-rose-400 text-rose-600 shadow-sm"
                    : "bg-white border-amber-100 text-stone-500 hover:border-amber-300 shadow-sm"
                }`}
              >
                {r === "win"
                  ? <><Trophy size={16} /> {t.matches.iWon}</>
                  : <><XCircle size={16} /> {t.matches.iLost}</>}
              </button>
            ))}
          </div>
          {submitError && (
            <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 mb-4 font-semibold">{submitError}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!result || submitting}
            className={`w-full h-14 flex items-center justify-center gap-2 font-bold text-base rounded-2xl cursor-pointer ${
              result && !submitting ? "btn-gold" : "bg-amber-100 text-amber-400 cursor-not-allowed"
            }`}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {submitting ? t.matches.submitting : t.matches.submit}
          </button>
        </div>
      )}

      {/* Join challenge */}
      {match.status === "open" && currentUserId && currentUserId !== match.challenger_id && !match.opponent_id && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center shadow-sm">
          <div className="text-4xl mb-3">⚔️</div>
          <p className="text-stone-800 font-extrabold mb-1">{t.matches.invited}</p>
          <p className="text-stone-500 text-sm font-semibold mb-5">
            {match.challenger?.username} {t.matches.invitedHint} {match.game_types?.name?.replace(/_/g, " ")}
          </p>
          {joinError && <p className="text-rose-600 text-sm font-semibold mb-3">{joinError}</p>}
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full h-14 flex items-center justify-center gap-2 btn-gold rounded-2xl cursor-pointer disabled:opacity-60"
          >
            {joining ? <Loader2 size={18} className="animate-spin" /> : <Swords size={18} />}
            {joining ? t.matches.joining : t.matches.acceptChallenge}
          </button>
        </div>
      )}

      {/* Waiting for opponent */}
      {match.status === "open" && (currentUserId === match.challenger_id || !currentUserId) && (
        <div className="bg-white border border-amber-200 rounded-3xl p-6 text-center shadow-sm">
          <Loader2 size={28} className="text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-stone-800 font-bold mb-1">{t.matches.waitingOpponent}</p>
          <p className="text-stone-500 text-sm font-semibold mt-1">{t.matches.shareHint}</p>
          <div className="flex flex-col items-center gap-2 mt-4">
            <button
              onClick={shareMatch}
              className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              {copied ? <><Check size={14} className="text-emerald-500" /> {t.common.copied}</> : <><Share2 size={14} /> {t.matches.shareLink}</>}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/matches/${id}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
              className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600 px-4 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <Copy size={11} /> {t.matches.copyLink}
            </button>
          </div>
          {currentUserId === match.challenger_id && (
            <div className="mt-5">
              {cancelError && <p className="text-rose-600 text-xs mb-2 font-semibold">{cancelError}</p>}
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={`flex items-center gap-2 text-xs px-4 py-2 rounded-xl transition-all cursor-pointer mx-auto border font-bold ${
                  cancelConfirm
                    ? "text-rose-600 border-rose-300 bg-rose-50 hover:bg-rose-100"
                    : "text-stone-400 border-stone-200 hover:text-stone-600 hover:border-stone-300"
                }`}
              >
                {cancelling ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                {cancelling ? t.matches.cancelling : cancelConfirm ? t.matches.cancelConfirm : t.matches.cancelChallenge}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
