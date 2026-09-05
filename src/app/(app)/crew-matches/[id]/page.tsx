"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Swords, Trophy, XCircle, Loader2, Users, RefreshCw, Trash2, CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/LanguageProvider";
import type { CrewMatchRow, CrewMatchParticipantRow } from "@/lib/types";

const STATUS_STYLE = {
  open:      { color: "text-sky-700",     border: "border-sky-700"     },
  active:    { color: "text-emerald-700", border: "border-emerald-700" },
  completed: { color: "text-[#4A3F2C]",   border: "border-[#E3DCCB]"   },
  cancelled: { color: "text-rose-700",    border: "border-rose-700"    },
};

export default function CrewMatchPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [match, setMatch] = useState<CrewMatchRow | null>(null);
  const [participants, setParticipants] = useState<CrewMatchParticipantRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userCrewId, setUserCrewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultStatus, setResultStatus] = useState<"idle" | "waiting" | "completed" | "disputed">("idle");
  const autoResolveTriggered = useRef(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const prevStatus = useRef<string | undefined>(undefined);
  const prevOpponentCrew = useRef<string | null | undefined>(undefined);
  const [opponentJoined, setOpponentJoined] = useState(false);

  const fetchParticipants = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("crew_match_participants")
      .select("id, crew_match_id, user_id, crew_id, joined_at, users(username,avatar_url), crews(name)")
      .eq("crew_match_id", id);
    if (data) setParticipants(data as unknown as CrewMatchParticipantRow[]);
  }, [id]);

  const fetchMatch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("crew_matches")
      .select("id, game_type_id, status, challenger_crew_id, opponent_crew_id, winner_crew_id, challenger_claim, opponent_claim, disputed, first_result_at, join_code, created_by, accepted_by, created_at, completed_at, game_types(name), challenger_crew:challenger_crew_id(name), opponent_crew:opponent_crew_id(name)")
      .eq("id", id)
      .single();
    if (data) setMatch(data as unknown as CrewMatchRow);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
      if (data.user?.id) {
        supabase
          .from("crew_members")
          .select("crew_id")
          .eq("user_id", data.user.id)
          .single()
          .then(({ data: m }) => setUserCrewId(m?.crew_id ?? null));
      }
    });
    function init() {
      fetchMatch();
      fetchParticipants();
    }
    init();

    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("crew_matches")
        .select("status, winner_crew_id, opponent_crew_id, challenger_claim, opponent_claim, first_result_at")
        .eq("id", id)
        .single();
      if (data) {
        if (prevOpponentCrew.current === null && data.opponent_crew_id) {
          setOpponentJoined(true);
          setTimeout(() => setOpponentJoined(false), 3500);
          fetchParticipants();
        }
        prevOpponentCrew.current = data.opponent_crew_id;
        prevStatus.current = data.status;
        setMatch((prev) => prev ? { ...prev, ...data } : prev);
        if (data.status === "completed" || data.status === "cancelled") clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, fetchMatch, fetchParticipants]);

  const handleJoin = async () => {
    setJoining(true);
    const res = await fetch(`/api/crew-matches/${id}/join`, { method: "POST" });
    if (res.ok) await fetchParticipants();
    setJoining(false);
  };

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError(null);
    const res = await fetch(`/api/crew-matches/${id}/accept`, { method: "POST" });
    if (res.ok) {
      await fetchMatch();
      await fetchParticipants();
    } else {
      const data = await res.json() as { error?: string };
      setAcceptError(data.error ?? "Failed to accept");
    }
    setAccepting(false);
  };

  const handleSubmit = async () => {
    if (!selectedWinner || !match) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch(`/api/crew-matches/${id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winner_crew_id: selectedWinner }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json() as { status?: "waiting" | "completed" | "disputed" };
      if (data.status === "waiting") {
        // Our crew has reported; the other crew still has to confirm.
        setResultStatus("waiting");
        await fetchMatch();
      } else {
        setResultStatus(data.status ?? "completed");
        setSubmitted(true);
        setMatch((prev) => prev ? { ...prev, status: "completed", winner_crew_id: selectedWinner } : prev);
      }
    } else if (res.status === 409) {
      await fetchMatch();
    } else {
      const data = await res.json() as { error?: string };
      setSubmitError(data.error ?? "Failed to submit result");
    }
  };

  // Trigger auto-resolve once the 10-minute window since the first crew report
  // has elapsed, so a silent crew can't strand the battle.
  useEffect(() => {
    if (!match?.first_result_at || match.status !== "active" || autoResolveTriggered.current) return;

    const autoAt = new Date(match.first_result_at).getTime() + 10 * 60 * 1000;
    const delay = autoAt - Date.now();

    const fire = () => {
      autoResolveTriggered.current = true;
      fetch(`/api/crew-matches/${id}/auto-resolve`, { method: "POST" })
        .then(() => fetchMatch())
        .catch(() => { autoResolveTriggered.current = false; });
    };

    if (delay <= 0) { fire(); return; }
    const timer = setTimeout(fire, delay);
    return () => clearTimeout(timer);
  }, [match?.first_result_at, match?.status, id, fetchMatch]);

  const handleCancel = async () => {
    if (!cancelConfirm) { setCancelConfirm(true); return; }
    setCancelling(true);
    setCancelError(null);
    const res = await fetch(`/api/crew-matches/${id}/cancel`, { method: "POST" });
    if (res.ok) {
      router.push("/crews");
    } else {
      const data = await res.json() as { error?: string };
      setCancelError(data.error ?? "Failed to cancel");
      setCancelConfirm(false);
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-violet-700 animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <div className="text-5xl mb-4">🤔</div>
          <p className="text-[#4A3F2C] font-medium mb-4">{t.crewMatches.notFound}</p>
          <Link href="/crews" className="link-arrow text-sm">{t.crewMatches.backHome}</Link>
        </div>
      </div>
    );
  }

  const challengerName = (match.challenger_crew as unknown as { name: string } | null)?.name ?? "Crew A";
  const opponentName = (match.opponent_crew as unknown as { name: string } | null)?.name ?? "???";
  const isInChallengerCrew = userCrewId === match.challenger_crew_id;
  const isInOpponentCrew = userCrewId === match.opponent_crew_id;
  const isParticipant = participants.some((p) => p.user_id === currentUserId);
  const challengerParticipants = participants.filter((p) => p.crew_id === match.challenger_crew_id);
  const opponentParticipants = participants.filter((p) => p.crew_id === match.opponent_crew_id);
  const isWinner = match.winner_crew_id !== null && match.winner_crew_id === userCrewId;
  // Dual confirmation: hide the form once our own crew has reported.
  const myClaim = isInChallengerCrew ? match.challenger_claim : match.opponent_claim;
  const iAlreadyReported = myClaim !== null || resultStatus === "waiting";
  const winnerName = match.winner_crew_id === match.challenger_crew_id ? challengerName : opponentName;
  const statusStyle = STATUS_STYLE[match.status] ?? STATUS_STYLE.open;
  const statusLabel = t.crewMatches.status[match.status] ?? match.status;
  const lobbyUrl = typeof window !== "undefined" ? `${window.location.origin}/crew-matches/${id}` : "";

  // Completion screen
  if (submitted || match.status === "completed") {
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col items-center justify-center text-center gap-6">
        <div className={`w-28 h-28 flex items-center justify-center ${
          isWinner
            ? "bg-violet-700 border border-violet-800"
            : "border border-[#E3DCCB]"
        }`}>
          {isWinner
            ? <Trophy size={44} className="text-white" />
            : <XCircle size={44} className="text-rose-700" />}
        </div>
        <div>
          {isWinner ? (
            <>
              <h2 className="display italic text-3xl mb-1 text-violet-700">{t.crewMatches.yourCrewWins}</h2>
              <p className="text-[#4A3F2C] text-sm font-medium">{t.crewMatches.crewWinsRecord}</p>
            </>
          ) : match.winner_crew_id ? (
            <>
              <h2 className="display italic text-3xl mb-1">
                {winnerName.toUpperCase()} {t.crewMatches.status.completed === "Completed" ? "WINS!" : "GEWINNT!"}
              </h2>
              <p className="text-[#4A3F2C] text-sm font-medium">{t.crewMatches.betterLuck}</p>
            </>
          ) : (
            <h2 className="display italic text-3xl mb-1">{t.matches.matchEnded}</h2>
          )}
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/matches/new" className="h-12 px-8 btn-gold flex items-center justify-center gap-2 cursor-pointer">
            <RefreshCw size={16} /> {t.crewMatches.rematch}
          </Link>
          <Link href="/crews" className="h-12 px-8 btn-outline font-bold flex items-center justify-center gap-2 cursor-pointer">
            <Users size={16} /> {t.crewMatches.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/crews" className="w-9 h-9 border border-[#14110F] flex items-center justify-center cursor-pointer">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="eyebrow mb-0.5">{t.crewMatches.lobbyTitle}</p>
          <h1 className="display text-2xl">{t.crewMatches.lobbyAccent}</h1>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border font-bold ${statusStyle.border} ${statusStyle.color}`}>
          {match.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />}
          {statusLabel}
        </span>
        <span className="text-xs border border-[#14110F] px-3 py-1.5 font-bold capitalize">
          {(match.game_types as unknown as { name: string } | null)?.name?.replace(/_/g, " ")}
        </span>
      </div>

      {/* Opponent joined notification */}
      {opponentJoined && (
        <div className="border border-emerald-700 px-4 py-3 mb-4 flex items-center gap-2 text-emerald-700 text-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
          Crew joined — battle is on! ⚔️
        </div>
      )}

      {/* VS card */}
      <div className="border border-violet-700 p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          {/* Challenger crew */}
          <div className="flex-1">
            <p className="text-[10px] text-violet-700 font-bold uppercase tracking-widest mb-1">{t.crewMatches.challengerCrew}</p>
            <p className="display text-lg leading-tight">{challengerName}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {challengerParticipants.length === 0 ? (
                <span className="text-[#6B5D42] text-xs font-medium">—</span>
              ) : (
                challengerParticipants.map((p) => (
                  <span key={p.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 font-bold border ${
                    p.user_id === currentUserId
                      ? "border-violet-700 text-violet-700"
                      : "border-[#E3DCCB] text-[#4A3F2C]"
                  }`}>
                    {(p.users as unknown as { username: string; avatar_url: string | null } | null)?.avatar_url && (
                      <Image src={(p.users as unknown as { avatar_url: string }).avatar_url} alt="" width={16} height={16} className="rounded-full object-cover flex-shrink-0" />
                    )}
                    {(p.users as unknown as { username: string } | null)?.username ?? "?"}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-4">
            <span className="display italic text-2xl">VS</span>
            <Swords size={14} className="text-[#E3DCCB]" />
          </div>

          {/* Opponent crew */}
          <div className="flex-1 text-right">
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-1">{t.crewMatches.opponentCrew}</p>
            {match.opponent_crew_id ? (
              <>
                <p className="display text-lg leading-tight">{opponentName}</p>
                <div className="mt-2 flex flex-wrap gap-1 justify-end">
                  {opponentParticipants.length === 0 ? (
                    <span className="text-[#6B5D42] text-xs font-medium">—</span>
                  ) : (
                    opponentParticipants.map((p) => (
                      <span key={p.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 font-bold border ${
                        p.user_id === currentUserId
                          ? "border-amber-700 text-amber-700"
                          : "border-[#E3DCCB] text-[#4A3F2C]"
                      }`}>
                        {(p.users as unknown as { username: string; avatar_url: string | null } | null)?.avatar_url && (
                          <Image src={(p.users as unknown as { avatar_url: string }).avatar_url} alt="" width={16} height={16} className="rounded-full object-cover flex-shrink-0" />
                        )}
                        {(p.users as unknown as { username: string } | null)?.username ?? "?"}
                      </span>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-[#6B5D42] font-bold text-sm mt-1">???</p>
            )}
          </div>
        </div>
      </div>

      {/* Join as participant button */}
      {(isInChallengerCrew || isInOpponentCrew) && !isParticipant && match.status !== "cancelled" && (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full h-12 mb-4 flex items-center justify-center gap-2 border-2 border-violet-700 hover:bg-violet-50 text-violet-700 font-bold transition-colors cursor-pointer disabled:opacity-60"
        >
          {joining ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
          {joining ? t.crewMatches.joining : t.crewMatches.joinBattle}
        </button>
      )}

      {/* Accept challenge block (opponent crew) */}
      {match.status === "open" && userCrewId && !isInChallengerCrew && !match.opponent_crew_id && (
        <div className="border border-amber-700 p-6 text-center mb-5">
          <div className="text-4xl mb-3">⚔️</div>
          <p className="font-extrabold mb-1">{t.crewMatches.title} {t.crewMatches.titleAccent}</p>
          <p className="text-[#4A3F2C] text-sm font-medium mb-5">{challengerName} {t.matches.invitedHint} {(match.game_types as unknown as { name: string } | null)?.name?.replace(/_/g, " ")}</p>
          {acceptError && <p className="text-rose-700 text-sm font-semibold mb-3">{acceptError}</p>}
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full h-14 flex items-center justify-center gap-2 btn-gold cursor-pointer disabled:opacity-60"
          >
            {accepting ? <Loader2 size={18} className="animate-spin" /> : <Swords size={18} />}
            {accepting ? t.crewMatches.accepting : t.crewMatches.acceptChallenge}
          </button>
        </div>
      )}

      {/* Waiting for opponent + QR code */}
      {match.status === "open" && (isInChallengerCrew || !currentUserId) && (
        <div className="border border-violet-700 p-6 text-center mb-5">
          <Loader2 size={28} className="text-violet-700 animate-spin mx-auto mb-3" />
          <p className="font-bold mb-1">{t.crewMatches.waitingCrew}</p>
          <p className="text-[#4A3F2C] text-sm font-medium mb-5">{t.crewMatches.shareQR}</p>
          {lobbyUrl && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white border border-violet-700">
                <QRCodeSVG value={lobbyUrl} size={180} />
              </div>
              <div className="text-center">
                <p className="eyebrow mb-1">{t.crewMatches.joinCode}</p>
                <p className="display text-2xl tracking-widest">{match.join_code}</p>
              </div>
            </div>
          )}
          {isInChallengerCrew && (
            <div className="mt-5">
              {cancelError && <p className="text-rose-700 text-xs mb-2 font-semibold">{cancelError}</p>}
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={`flex items-center gap-2 text-xs px-4 py-2 transition-colors cursor-pointer mx-auto border font-bold ${
                  cancelConfirm
                    ? "text-rose-700 border-rose-700 bg-rose-50 hover:bg-rose-100"
                    : "text-[#6B5D42] border-[#E3DCCB] hover:text-[#14110F] hover:border-[#14110F]"
                }`}
              >
                {cancelling ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                {cancelling ? t.crewMatches.cancelling : cancelConfirm ? t.crewMatches.cancelConfirm : t.crewMatches.cancelChallenge}
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR code also shown in active state for in-person late joiners */}
      {match.status === "active" && (isInChallengerCrew || isInOpponentCrew) && lobbyUrl && (
        <div className="border border-violet-700 p-4 mb-5">
          <p className="eyebrow mb-3 text-center">{t.crewMatches.shareQR}</p>
          <div className="flex items-center justify-center gap-6">
            <div className="p-2 bg-white border border-violet-700">
              <QRCodeSVG value={lobbyUrl} size={100} />
            </div>
            <div>
              <p className="eyebrow mb-1">{t.crewMatches.joinCode}</p>
              <p className="display text-xl tracking-widest">{match.join_code}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit result — shown to participants once match is active, until their
          own crew has reported. The other crew must confirm before it counts. */}
      {match.status === "active" && isParticipant && !iAlreadyReported && (
        <div>
          <p className="eyebrow mb-2">{t.crewMatches.submitResult}</p>
          <p className="text-[#6B5D42] text-xs font-medium mb-3">{t.matches.submitHint}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {([
              { label: t.crewMatches.weWon, crewId: userCrewId!, isWin: true },
              { label: t.crewMatches.weLost, crewId: userCrewId === match.challenger_crew_id ? match.opponent_crew_id! : match.challenger_crew_id, isWin: false },
            ]).map(({ label, crewId, isWin }) => (
              <button
                key={label}
                onClick={() => setSelectedWinner(crewId)}
                className={`h-14 border-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors cursor-pointer ${
                  selectedWinner === crewId
                    ? isWin
                      ? "bg-emerald-600 border-emerald-700 text-white"
                      : "bg-rose-50 border-rose-700 text-rose-700"
                    : "border-[#E3DCCB] text-[#4A3F2C] hover:border-[#14110F]"
                }`}
              >
                {isWin ? <Trophy size={16} /> : <XCircle size={16} />}
                {label}
              </button>
            ))}
          </div>
          {submitError && (
            <div className="text-rose-700 text-sm border border-rose-700 bg-rose-50 px-4 py-3 mb-4 font-semibold">{submitError}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!selectedWinner || submitting}
            className={`w-full h-14 flex items-center justify-center gap-2 font-bold text-base cursor-pointer ${
              selectedWinner && !submitting ? "btn-gold" : "border border-[#E3DCCB] text-[#6B5D42] cursor-not-allowed"
            }`}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {submitting ? t.crewMatches.submitting : t.crewMatches.submit}
          </button>
        </div>
      )}

      {/* Our crew reported — the other crew still has to confirm */}
      {match.status === "active" && isParticipant && iAlreadyReported && (
        <div className="border border-[#E3DCCB] p-5 text-center">
          <Loader2 size={20} className="animate-spin text-[#6B5D42] mx-auto mb-3" />
          <p className="font-bold mb-1">{t.matches.waitingConfirmation}</p>
          <p className="text-[#6B5D42] text-xs font-medium">{t.matches.waitingConfirmationHint}</p>
        </div>
      )}
    </div>
  );
}
