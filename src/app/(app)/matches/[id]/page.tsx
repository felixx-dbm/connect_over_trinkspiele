"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Trophy, Swords, Loader2, Share2, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

const STATUS_CONFIG = {
  open: { label: "Waiting", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  active: { label: "In Progress", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  completed: { label: "Completed", color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
      try {
        await navigator.share({ title: "Join my battle!", url });
        usedShare = true;
      } catch {
        // Fallthrough to clipboard
      }
    }
    if (!usedShare) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async () => {
    if (!result || !match || !currentUserId) return;
    setSubmitting(true);
    setSubmitError(null);

    const winnerId = result === "win" ? currentUserId : (
      match.challenger_id === currentUserId ? match.opponent_id : match.challenger_id
    );

    const res = await fetch(`/api/matches/${id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winner_id: winnerId }),
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setMatch((prev) => prev ? { ...prev, status: "completed", winner_id: winnerId } : prev);
    } else {
      const data = await res.json() as { error?: string };
      if (res.status === 409) {
        setSubmitError("Result already submitted — refresh to see outcome.");
        fetchMatch();
      } else {
        setSubmitError(data.error ?? "Failed to submit result");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-zinc-400 mb-4">Match not found.</p>
          <Link href="/home" className="text-amber-400 text-sm hover:text-amber-300">← Back to home</Link>
        </div>
      </div>
    );
  }

  const isWinner = match.winner_id === currentUserId;
  const statusConfig = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.open;

  if (submitted || match.status === "completed") {
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col items-center justify-center text-center gap-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
          isWinner ? "bg-amber-500/10 border-2 border-amber-500/40" : "bg-zinc-800 border-2 border-zinc-700"
        }`}>
          {isWinner ? <Trophy size={40} className="text-amber-400" /> : <XCircle size={40} className="text-zinc-500" />}
        </div>
        <div>
          <h2 className="font-display text-3xl text-zinc-100 mb-2">
            {match.winner_id === null
              ? "MATCH ENDED"
              : isWinner
              ? <span>YOU <span className="text-amber-400">WIN!</span></span>
              : <span>BETTER LUCK<br /><span className="text-zinc-400">NEXT TIME</span></span>}
          </h2>
          <p className="text-zinc-500 text-sm">
            {isWinner ? "Win added to your record!" : "Keep practicing!"}
          </p>
        </div>
        <Link
          href="/home"
          className="h-12 px-8 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <Swords size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  const challengerName = match.challenger?.username ?? "Unknown";
  const opponentName = match.opponent?.username ?? "Waiting…";
  const challengerInitials = challengerName.slice(0, 2).toUpperCase();
  const opponentInitials = match.opponent ? opponentName.slice(0, 2).toUpperCase() : "?";
  const isChallenger = match.challenger_id === currentUserId;

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-xl text-zinc-100">
          MATCH <span className="text-amber-400">LOBBY</span>
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}>
          {match.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          {statusConfig.label}
        </span>
        <span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 capitalize">
          {match.game_types?.name?.replace("_", " ")}
        </span>
        <span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 capitalize">
          {match.mode}
        </span>
      </div>

      {/* VS card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-zinc-800/30 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-display text-lg ${
              isChallenger ? "bg-amber-500 text-zinc-950" : "bg-zinc-700 text-zinc-300"
            }`}>
              {challengerInitials}
            </div>
            <p className="text-zinc-200 font-semibold text-sm text-center">{challengerName}</p>
            {isChallenger && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">You</span>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-2xl text-amber-400">VS</span>
            <Swords size={16} className="text-zinc-600" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-display text-lg ${
              !isChallenger && match.opponent ? "bg-amber-500 text-zinc-950" : "bg-zinc-700 text-zinc-300"
            }`}>
              {opponentInitials}
            </div>
            <p className="text-zinc-200 font-semibold text-sm text-center">{opponentName}</p>
            {!isChallenger && match.opponent && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">You</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-2">
          <Clock size={14} className="text-zinc-600" />
          <div>
            <p className="text-zinc-500 text-xs">Started</p>
            <p className="text-zinc-300 text-sm font-medium">
              {new Date(match.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-2">
          <MapPin size={14} className="text-zinc-600" />
          <div>
            <p className="text-zinc-500 text-xs">Mode</p>
            <p className="text-zinc-300 text-sm font-medium capitalize">{match.mode}</p>
          </div>
        </div>
      </div>

      {match.status === "active" && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Submit Result</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(["win", "loss"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setResult(r)}
                className={`h-14 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                  result === r
                    ? r === "win"
                      ? "bg-amber-500 border-amber-500 text-zinc-950 amber-glow"
                      : "bg-zinc-700 border-zinc-600 text-zinc-200"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {r === "win" ? <><Trophy size={16} /> I Won</> : <><XCircle size={16} /> I Lost</>}
              </button>
            ))}
          </div>
          {submitError && (
            <div className="text-amber-400 text-sm bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
              {submitError}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!result || submitting}
            className={`w-full h-14 flex items-center justify-center gap-2 font-bold text-base rounded-2xl transition-all cursor-pointer ${
              result && !submitting
                ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 active:scale-[0.98] amber-glow"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {submitting ? "Submitting…" : "Submit Result"}
          </button>
        </div>
      )}

      {match.status === "open" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
          <Loader2 size={24} className="text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-zinc-300 font-medium">Waiting for opponent…</p>
          <p className="text-zinc-500 text-sm mt-1">Share the link below to invite someone</p>
          <button
            onClick={shareMatch}
            className="mt-4 flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer mx-auto"
          >
            {copied ? <><Check size={14} className="text-green-400" /> Copied!</> : <><Share2 size={14} /> Share Match Link</>}
          </button>
        </div>
      )}
    </div>
  );
}
