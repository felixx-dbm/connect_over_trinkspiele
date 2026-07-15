"use client";

/**
 * Match detail — the full lifecycle of a battle: waiting for an opponent,
 * joining teams, live scoring, confirming the result and reporting players.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Trophy, Swords, Loader2, Share2, Copy, Check, RefreshCw, Trash2, Users, UserPlus, Navigation, Timer, Play, Flag } from "lucide-react";
import ReportModal from "@/components/ReportModal";
import GameCompanion from "@/components/GameCompanion";
import { createClient } from "@/lib/supabase/client";
import { copyToClipboard } from "@/lib/browser";
import { useT } from "@/components/LanguageProvider";

type Match = {
  id: string;
  status: "open" | "active" | "completed" | "cancelled";
  mode: string;
  winner_id: string | null;
  challenger_id: string;
  opponent_id: string | null;
  created_at: string;
  expires_at: string | null;
  team_size: number;
  slots_challenger: number;
  slots_opponent: number;
  challenger_result: "win" | "loss" | null;
  opponent_result: "win" | "loss" | null;
  first_result_at: string | null;
  disputed: boolean;
  meeting_hint: string | null;
  fuzzy_lat: number | null;
  fuzzy_lng: number | null;
  is_open_lobby: boolean;
  custom_game_name: string | null;
  game_types: { name: string } | null;
  challenger: { username: string; avatar_url: string | null } | null;
  opponent: { username: string; avatar_url: string | null } | null;
};

type MatchMember = {
  id: string;
  user_id: string;
  team: "challenger" | "opponent";
  users: { username: string; avatar_url: string | null } | null;
};

const STATUS_STYLE = {
  open:      { color: "text-sky-700",     border: "border-sky-700"     },
  active:    { color: "text-emerald-700", border: "border-emerald-700" },
  completed: { color: "text-[#4A3F2C]",   border: "border-[#E3DCCB]"   },
  cancelled: { color: "text-rose-700",    border: "border-rose-700"    },
};

export default function MatchPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [members, setMembers] = useState<MatchMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myResult, setMyResult] = useState<"win" | "loss" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultStatus, setResultStatus] = useState<"idle" | "waiting" | "completed" | "disputed">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState<"challenger" | "opponent" | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [resolveCountdown, setResolveCountdown] = useState<string | null>(null);
  const prevOpponentId = useRef<string | null | undefined>(undefined);
  const prevStatus = useRef<string | undefined>(undefined);
  const autoResolveTriggered = useRef(false);

  const fetchMembers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("match_members")
      .select("id, user_id, team, users(username,avatar_url)")
      .eq("match_id", id);
    if (data) setMembers(data as unknown as MatchMember[]);
  }, [id]);

  const fetchMatch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("matches")
      .select("id, status, mode, winner_id, challenger_id, opponent_id, created_at, expires_at, team_size, slots_challenger, slots_opponent, challenger_result, opponent_result, first_result_at, disputed, meeting_hint, fuzzy_lat, fuzzy_lng, is_open_lobby, custom_game_name, game_types(name), challenger:challenger_id(username,avatar_url), opponent:opponent_id(username,avatar_url)")
      .eq("id", id)
      .single();
    if (data) setMatch(data as unknown as Match);
    setLoading(false);
  }, [id]);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));

    function init() {
      fetchMatch();
      fetchMembers();
    }
    init();

    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("matches")
        .select("status, winner_id, opponent_id, slots_challenger, slots_opponent, challenger_result, opponent_result, first_result_at, disputed")
        .eq("id", id)
        .single();
      if (data) {
        // Opponent joined (1v1) or team slot filled
        if (prevOpponentId.current === null && data.opponent_id) {
          showNotif(t.matches.opponentJoined);
          fetchMatch();
          fetchMembers();
        }
        // Team slots changed
        if (prevStatus.current === "open" && data.status === "active") {
          showNotif(t.matches.teamFilled);
          fetchMembers();
        }
        prevOpponentId.current = data.opponent_id;
        prevStatus.current = data.status;
        setMatch((prev) => prev ? { ...prev, ...data } : prev);
        if (data.status === "completed" || data.status === "cancelled") clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, fetchMatch, fetchMembers, t.matches.opponentJoined, t.matches.teamFilled]);

  useEffect(() => {
    if (!match?.expires_at || match.status !== "open") return;
    const tick = () => {
      const ms = new Date(match.expires_at!).getTime() - Date.now();
      if (ms <= 0) { setTimeLeft(null); return; }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [match?.expires_at, match?.status]);

  // Countdown to auto-resolve (10 min after first result submitted)
  useEffect(() => {
    function reset() { setResolveCountdown(null); }
    if (!match?.first_result_at || match.status !== "active") {
      reset();
      return;
    }
    const autoAt = new Date(match.first_result_at).getTime() + 10 * 60 * 1000;
    const tick = () => {
      const ms = autoAt - Date.now();
      if (ms <= 0) {
        setResolveCountdown("0:00");
        return;
      }
      const m = Math.floor(ms / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setResolveCountdown(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [match?.first_result_at, match?.status]);

  // Trigger auto-resolve when countdown expires and I'm a participant
  useEffect(() => {
    if (!match?.first_result_at || match.status !== "active" || autoResolveTriggered.current) return;
    const autoAt = new Date(match.first_result_at).getTime() + 10 * 60 * 1000;
    const delay = autoAt - Date.now();
    if (delay > 0) {
      const timer = setTimeout(async () => {
        if (autoResolveTriggered.current) return;
        autoResolveTriggered.current = true;
        await fetch(`/api/matches/${id}/auto-resolve`, { method: "POST" });
        await fetchMatch();
      }, delay);
      return () => clearTimeout(timer);
    }
    // Already expired — trigger immediately
    autoResolveTriggered.current = true;
    fetch(`/api/matches/${id}/auto-resolve`, { method: "POST" }).then(() => fetchMatch());
  }, [match?.first_result_at, match?.status, id, fetchMatch]);

  const shareMatch = async () => {
    const url = `${window.location.origin}/matches/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Join my battle!", url }); return; } catch {}
    }
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinTeam = async (team: "challenger" | "opponent") => {
    setJoining(team);
    setJoinError(null);
    const res = await fetch(`/api/matches/${id}/join-team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team }),
    });
    if (res.ok) { await fetchMatch(); await fetchMembers(); }
    else { const d = await res.json() as { error?: string }; setJoinError(d.error ?? "Failed to join"); }
    setJoining(null);
  };

  // Legacy 1v1 accept (team_size === 1, no match_members)
  const handleAccept = async () => {
    setJoining("opponent");
    setJoinError(null);
    const res = await fetch(`/api/matches/${id}/accept`, { method: "POST" });
    if (res.ok) { await fetchMatch(); }
    else { const d = await res.json() as { error?: string }; setJoinError(d.error ?? "Failed to join"); }
    setJoining(null);
  };

  const handleCancel = async () => {
    if (!cancelConfirm) { setCancelConfirm(true); return; }
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/matches/${id}/cancel`, { method: "POST" });
      if (res.ok) router.push("/home");
      else { const d = await res.json() as { error?: string }; setCancelError(d.error ?? "Failed"); setCancelConfirm(false); }
    } catch { setCancelError("Network error"); setCancelConfirm(false); }
    finally { setCancelling(false); }
  };

  const handleStart = async () => {
    setStarting(true);
    setStartError(null);
    const res = await fetch(`/api/matches/${id}/start`, { method: "POST" });
    if (res.ok) { await fetchMatch(); }
    else { const d = await res.json() as { error?: string }; setStartError(d.error ?? "Failed to start"); }
    setStarting(false);
  };

  const handleSubmit = async () => {
    if (!myResult || !match || !currentUserId) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch(`/api/matches/${id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: myResult }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json() as { status: string };
      if (data.status === "waiting") {
        setResultStatus("waiting");
      } else if (data.status === "disputed") {
        setResultStatus("disputed");
        await fetchMatch();
      } else {
        setResultStatus("completed");
        await fetchMatch();
      }
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
        <Loader2 size={32} className="text-[#14110F] animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <div className="text-5xl mb-4">🤔</div>
          <p className="text-[#4A3F2C] font-medium mb-4">{t.matches.notFound}</p>
          <Link href="/home" className="link-arrow text-sm">{t.matches.backHome}</Link>
        </div>
      </div>
    );
  }

  const isTeamGame      = match.team_size > 1;
  const isOpenLobby     = match.is_open_lobby;
  const challengerName  = match.challenger?.username ?? "Unknown";
  const opponentName    = match.opponent?.username ?? "Waiting…";
  const isChallenger    = match.challenger_id === currentUserId;
  const isParticipant   = currentUserId === match.challenger_id || currentUserId === match.opponent_id ||
                          members.some((m) => m.user_id === currentUserId);
  const isWinner        = match.winner_id === currentUserId;
  const winnerName      = match.winner_id === match.challenger_id ? challengerName : opponentName;
  const statusStyle     = STATUS_STYLE[match.status] ?? STATUS_STYLE.open;
  const statusLabel     = t.matches.status[match.status] ?? match.status;
  const rawGameName     = match.game_types?.name?.replace(/_/g, " ") ?? "match";
  const gameName        = match.custom_game_name ?? rawGameName;

  // Which side did I submit?
  const mySubmittedResult = isChallenger ? match.challenger_result : match.opponent_result;
  const theirResult       = isChallenger ? match.opponent_result   : match.challenger_result;
  const iAlreadySubmitted = mySubmittedResult !== null || resultStatus === "waiting";

  // Completion / post-game screen
  if (match.status === "completed" || (resultStatus !== "idle" && resultStatus !== "waiting")) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-6 flex flex-col items-center justify-center text-center gap-6">
        {match.disputed && (
          <div className="border border-amber-700 px-4 py-3 text-amber-700 text-xs font-bold w-full max-w-xs">
            {t.matches.disputedSub}
          </div>
        )}
        <div className={`w-28 h-28 flex items-center justify-center ${
          !isParticipant
            ? "border border-[#E3DCCB]"
            : isWinner
            ? "bg-emerald-600 border border-emerald-700"
            : "border border-[#E3DCCB]"
        }`}>
          {!isParticipant
            ? <Trophy size={44} className="text-[#6B5D42]" />
            : isWinner
            ? <Trophy size={44} className="text-white" />
            : <XCircle size={44} className="text-rose-700" />}
        </div>
        <div>
          {!isParticipant ? (
            <>
              <h2 className="display italic text-3xl mb-1">
                {winnerName.toUpperCase()} {t.matches.wins}
              </h2>
              <p className="text-[#4A3F2C] text-sm font-medium capitalize">{gameName}</p>
            </>
          ) : isWinner ? (
            <>
              <h2 className="display italic text-3xl mb-1 text-emerald-700">
                {t.matches.youWin}
              </h2>
              <p className="text-[#4A3F2C] text-sm font-medium">{t.matches.winRecord}</p>
            </>
          ) : match.winner_id ? (
            <>
              <h2 className="display italic text-3xl mb-1 text-rose-700">{t.matches.betterLuck}</h2>
              <p className="text-[#4A3F2C] text-sm font-medium">{t.matches.lossAck}</p>
              <p className="text-[#6B5D42] text-xs font-medium mt-1">{t.matches.lossAckSub}</p>
            </>
          ) : (
            <h2 className="display italic text-3xl mb-1">{t.matches.matchEnded}</h2>
          )}
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/matches/new" className="h-12 px-8 btn-gold flex items-center justify-center gap-2 cursor-pointer">
            <RefreshCw size={16} /> {t.matches.rematch}
          </Link>
          <Link href="/home" className="h-12 px-8 btn-outline font-bold flex items-center justify-center gap-2 cursor-pointer">
            <Swords size={16} /> {t.matches.backHome}
          </Link>
        </div>
      </div>
    );
  }

  const challengerMembers = members.filter((m) => m.team === "challenger");
  const opponentMembers   = members.filter((m) => m.team === "opponent");
  const alreadyJoined = members.some((m) => m.user_id === currentUserId) ||
    currentUserId === match.challenger_id;

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/home" className="w-9 h-9 border border-[#14110F] flex items-center justify-center cursor-pointer">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="eyebrow mb-0.5">{t.matches.lobbyTitle}</p>
          <h1 className="display text-2xl">{t.matches.lobbyAccent}</h1>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border font-bold ${statusStyle.border} ${statusStyle.color}`}>
          {match.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />}
          {statusLabel}
        </span>
        <span className="text-xs border border-[#14110F] px-3 py-1.5 font-bold capitalize">
          {gameName}
        </span>
        {isOpenLobby && (
          <span className="text-xs border border-emerald-700 px-3 py-1.5 text-emerald-700 font-bold flex items-center gap-1">
            <Users size={10} />{t.matches.openLobbyBadge}
          </span>
        )}
        {isTeamGame && !isOpenLobby && (
          <span className="text-xs border border-violet-700 px-3 py-1.5 text-violet-700 font-bold">
            {match.team_size}v{match.team_size}
          </span>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div className="border border-emerald-700 px-4 py-3 mb-4 flex items-center gap-2 text-emerald-700 text-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
          {notification}
        </div>
      )}

      {/* Opponent reported, waiting for me */}
      {match.status === "active" && isParticipant && theirResult !== null && !iAlreadySubmitted && (
        <div className="border border-amber-700 px-4 py-3 mb-4 text-amber-800 text-sm font-bold">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg leading-none">👆</span>
            {t.matches.opponentReported}
          </div>
          {resolveCountdown && (
            <p className="text-amber-700 text-xs font-semibold mt-1 pl-1">
              {t.matches.autoResolvesIn.replace("{time}", resolveCountdown)}
            </p>
          )}
        </div>
      )}

      {/* Waiting for opponent to confirm after I submitted */}
      {(resultStatus === "waiting" || (mySubmittedResult !== null && theirResult === null)) && match.status === "active" && (
        <div className="border border-sky-700 px-4 py-3 mb-4 text-sky-700 text-sm font-bold">
          <div className="flex items-center gap-2 mb-0.5">
            <Loader2 size={13} className="animate-spin flex-shrink-0" />
            {t.matches.waitingConfirmation}
          </div>
          {resolveCountdown ? (
            <p className="text-sky-700 text-xs font-semibold pl-5">
              {t.matches.autoResolvesIn.replace("{time}", resolveCountdown)}
            </p>
          ) : (
            <p className="text-sky-700 text-xs font-semibold pl-5">{t.matches.waitingConfirmationHint}</p>
          )}
        </div>
      )}

      {/* VS card */}
      <div className="border border-[#14110F] p-6 mb-5">
        {isTeamGame ? (
          /* ── Team slot display ── */
          <div className="flex items-start justify-between gap-4">
            {/* Challenger team */}
            <div className="flex-1">
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-2">{challengerName}</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: match.team_size }).map((_, i) => {
                  const member = challengerMembers[i];
                  return (
                    <div key={i} className={`relative w-10 h-10 overflow-hidden flex items-center justify-center display-upright text-sm ${
                      member
                        ? member.user_id === currentUserId
                          ? "bg-amber-600 text-white"
                          : "border border-[#E3DCCB] text-[#4A3F2C]"
                        : "border border-dashed border-amber-300 text-amber-400"
                    }`}>
                      {member
                        ? member.users?.avatar_url
                          ? <Image src={member.users.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                          : (member.users?.username?.slice(0, 2).toUpperCase() ?? "??")
                        : "+"}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-2">
              <span className="display italic text-xl">VS</span>
              <Swords size={12} className="text-[#E3DCCB]" />
            </div>
            {/* Opponent team */}
            <div className="flex-1 text-right">
              <p className="text-[10px] text-violet-700 font-bold uppercase tracking-widest mb-2">
                {match.opponent ? opponentName : "???"}
              </p>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {Array.from({ length: match.team_size }).map((_, i) => {
                  const member = opponentMembers[i];
                  return (
                    <div key={i} className={`relative w-10 h-10 overflow-hidden flex items-center justify-center display-upright text-sm ${
                      member
                        ? member.user_id === currentUserId
                          ? "bg-violet-700 text-white"
                          : "border border-[#E3DCCB] text-[#4A3F2C]"
                        : "border border-dashed border-violet-300 text-violet-400"
                    }`}>
                      {member
                        ? member.users?.avatar_url
                          ? <Image src={member.users.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                          : (member.users?.username?.slice(0, 2).toUpperCase() ?? "??")
                        : "+"}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── 1v1 display ── */
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className={`relative w-16 h-16 overflow-hidden flex items-center justify-center display-upright text-lg ${
                isChallenger
                  ? "bg-amber-600 text-white"
                  : "border border-[#E3DCCB] text-[#4A3F2C]"
              }`}>
                {match.challenger?.avatar_url
                  ? <Image src={match.challenger.avatar_url} alt="" fill sizes="64px" className="object-cover" />
                  : challengerName.slice(0, 2).toUpperCase()}
              </div>
              <p className="font-bold text-sm text-center">{challengerName}</p>
              {isChallenger && <span className="text-xs border border-amber-700 text-amber-700 px-2 py-0.5 font-bold">{t.matches.you}</span>}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="display italic text-2xl">VS</span>
              <Swords size={16} className="text-[#E3DCCB]" />
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className={`relative w-16 h-16 overflow-hidden flex items-center justify-center display-upright text-lg ${
                !isChallenger && match.opponent
                  ? "bg-amber-600 text-white"
                  : "border border-[#E3DCCB] text-[#4A3F2C]"
              }`}>
                {match.opponent?.avatar_url
                  ? <Image src={match.opponent.avatar_url} alt="" fill sizes="64px" className="object-cover" />
                  : match.opponent ? opponentName.slice(0, 2).toUpperCase() : "?"}
              </div>
              <p className="font-bold text-sm text-center">{opponentName}</p>
              {!isChallenger && match.opponent && <span className="text-xs border border-amber-700 text-amber-700 px-2 py-0.5 font-bold">{t.matches.you}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Match info chips */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-[#14110F] p-3 flex items-center gap-2">
          <Clock size={14} className="text-[#6B5D42] flex-shrink-0" />
          <div>
            <p className="text-[#6B5D42] text-xs font-bold">{t.matches.started}</p>
            <p className="text-sm font-extrabold">
              {new Date(match.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="border border-[#14110F] p-3 flex items-center gap-2">
          {timeLeft ? (
            <>
              <Timer size={14} className="text-[#6B5D42] flex-shrink-0" />
              <div>
                <p className="text-[#6B5D42] text-xs font-bold">{t.matches.expiresIn}</p>
                <p className="text-sm font-extrabold">{timeLeft}</p>
              </div>
            </>
          ) : (
            <>
              <MapPin size={14} className="text-[#6B5D42] flex-shrink-0" />
              <div>
                <p className="text-[#6B5D42] text-xs font-bold">{t.matches.mode}</p>
                <p className="text-sm font-extrabold capitalize">{match.mode}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meeting point */}
      {(match.meeting_hint || match.fuzzy_lat) && match.status !== "cancelled" && (
        <div className="border border-emerald-700 p-4 mb-5 flex items-start gap-3">
          <MapPin size={15} className="text-emerald-700 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-widest mb-0.5">{t.matches.meetingPoint}</p>
            {match.meeting_hint && (
              <p className="text-sm font-semibold leading-snug">{match.meeting_hint}</p>
            )}
          </div>
          {match.fuzzy_lat && match.fuzzy_lng && (
            <a
              href={`https://maps.google.com/?q=${match.fuzzy_lat},${match.fuzzy_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-700 text-white text-xs font-bold px-3 py-2 hover:bg-emerald-800 transition-colors"
            >
              <Navigation size={12} />
              {t.matches.navigate}
            </a>
          )}
        </div>
      )}

      {/* ── ACTIVE: match started banner ── */}
      {match.status === "active" && isParticipant && (
        <div className="border border-emerald-700 px-4 py-3 mb-4 flex items-center gap-2 text-emerald-700 text-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
          {t.matches.matchStarted}
        </div>
      )}

      {match.status === "active" && isParticipant && (
        <GameCompanion
          gameType={match.game_types?.name ?? "freestyle"}
          matchId={match.id}
          challengerName={challengerName}
          opponentName={opponentName}
          isChallenger={isChallenger}
        />
      )}

      {/* ── ACTIVE: Result submission ── */}
      {match.status === "active" && isParticipant && !iAlreadySubmitted && (
        <div>
          <p className="eyebrow mb-1">{t.matches.submitResult}</p>
          <p className="text-[#6B5D42] text-xs font-medium mb-3">{t.matches.submitHint}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(["win", "loss"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setMyResult(r)}
                className={`h-14 border-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors cursor-pointer ${
                  myResult === r
                    ? r === "win"
                      ? "bg-emerald-600 border-emerald-700 text-white"
                      : "bg-rose-50 border-rose-700 text-rose-700"
                    : "border-[#E3DCCB] text-[#4A3F2C] hover:border-[#14110F]"
                }`}
              >
                {r === "win"
                  ? <><Trophy size={16} /> {t.matches.iWon}</>
                  : <><XCircle size={16} /> {t.matches.iLost}</>}
              </button>
            ))}
          </div>
          {submitError && (
            <div className="text-rose-700 text-sm border border-rose-700 bg-rose-50 px-4 py-3 mb-4 font-semibold">{submitError}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!myResult || submitting}
            className={`w-full h-14 flex items-center justify-center gap-2 font-bold text-base cursor-pointer ${
              myResult && !submitting ? "btn-gold" : "border border-[#E3DCCB] text-[#6B5D42] cursor-not-allowed"
            }`}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {submitting ? t.matches.submitting : t.matches.submit}
          </button>
        </div>
      )}

      {/* ── OPEN (team game): join slots ── */}
      {match.status === "open" && isTeamGame && currentUserId && (
        <div className="border border-[#14110F] p-6 mb-5">
          <div className="text-4xl mb-3 text-center">⚔️</div>

          {/* Player counts for open lobby */}
          {isOpenLobby && (
            <p className="font-bold text-center text-sm mb-4">
              {t.matches.playersReady
                .replace("{c}", String(match.slots_challenger))
                .replace("{o}", String(match.slots_opponent))}
            </p>
          )}

          {!isOpenLobby && (
            <>
              <p className="font-extrabold text-center mb-1">{match.team_size}v{match.team_size} · {gameName}</p>
              <p className="text-[#4A3F2C] text-sm font-medium text-center mb-5">{t.matches.shareHint}</p>
            </>
          )}

          {joinError && <p className="text-rose-700 text-sm font-semibold mb-3 text-center">{joinError}</p>}

          {/* Join buttons — always shown for team games while open */}
          {!alreadyJoined && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleJoinTeam("challenger")}
                disabled={joining !== null || (!isOpenLobby && match.slots_challenger >= match.team_size)}
                className="h-12 flex items-center justify-center gap-2 border-2 border-amber-700 hover:bg-amber-50 text-amber-700 font-bold cursor-pointer disabled:opacity-50 transition-colors text-sm"
              >
                {joining === "challenger" ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {!isOpenLobby && match.slots_challenger >= match.team_size ? t.matches.teamFull : t.matches.joinChallengers}
              </button>
              <button
                onClick={() => handleJoinTeam("opponent")}
                disabled={joining !== null || (!isOpenLobby && match.slots_opponent >= match.team_size)}
                className="h-12 flex items-center justify-center gap-2 border-2 border-violet-700 hover:bg-violet-50 text-violet-700 font-bold cursor-pointer disabled:opacity-50 transition-colors text-sm"
              >
                {joining === "opponent" ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
                {!isOpenLobby && match.slots_opponent >= match.team_size ? t.matches.teamFull : t.matches.acceptChallenge}
              </button>
            </div>
          )}

          {/* Open lobby host controls */}
          {isOpenLobby && isChallenger && (
            <div className="flex flex-col gap-2 mt-2">
              {startError && <p className="text-rose-700 text-xs font-semibold text-center">{startError}</p>}
              <button
                onClick={handleStart}
                disabled={starting || match.slots_challenger < 1 || match.slots_opponent < 1}
                className={`w-full h-14 flex items-center justify-center gap-2 font-bold text-base cursor-pointer ${
                  !starting && match.slots_challenger >= 1 && match.slots_opponent >= 1
                    ? "btn-gold"
                    : "border border-[#E3DCCB] text-[#6B5D42] cursor-not-allowed"
                }`}
              >
                {starting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                {starting ? t.matches.starting : t.matches.startBattle}
              </button>
              {(match.slots_challenger < 1 || match.slots_opponent < 1) && (
                <p className="text-[#6B5D42] text-xs font-medium text-center">{t.matches.needBothTeams}</p>
              )}
              <button onClick={shareMatch} className="w-full flex items-center justify-center gap-2 text-sm border border-[#14110F] hover:bg-[#14110F] hover:text-[#FAF8F3] font-bold px-5 py-2.5 transition-colors cursor-pointer">
                {copied ? <><Check size={14} /> {t.common.copied}</> : <><Share2 size={14} /> {t.matches.shareLink}</>}
              </button>
              {cancelError && <p className="text-rose-700 text-xs font-semibold text-center">{cancelError}</p>}
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
                {cancelling ? t.matches.cancelling : cancelConfirm ? t.matches.cancelConfirm : t.matches.cancelChallenge}
              </button>
            </div>
          )}

          {/* Open lobby non-host: waiting message */}
          {isOpenLobby && !isChallenger && alreadyJoined && (
            <div className="flex items-center justify-center gap-2 mt-2 text-[#4A3F2C] text-sm font-medium">
              <Loader2 size={14} className="animate-spin" />
              {t.matches.waitingForHost}
            </div>
          )}
        </div>
      )}

      {/* ── OPEN (1v1): join or waiting ── */}
      {match.status === "open" && !isTeamGame && (
        <>
          {currentUserId && currentUserId !== match.challenger_id && !match.opponent_id ? (
            <div className="border border-amber-700 p-6 text-center">
              <div className="text-4xl mb-3">⚔️</div>
              <p className="font-extrabold mb-1">{t.matches.invited}</p>
              <p className="text-[#4A3F2C] text-sm font-medium mb-5">
                {match.challenger?.username} {t.matches.invitedHint} {gameName}
              </p>
              {joinError && <p className="text-rose-700 text-sm font-semibold mb-3">{joinError}</p>}
              <button
                onClick={handleAccept}
                disabled={joining !== null}
                className="w-full h-14 flex items-center justify-center gap-2 btn-gold cursor-pointer disabled:opacity-60"
              >
                {joining ? <Loader2 size={18} className="animate-spin" /> : <Swords size={18} />}
                {joining ? t.matches.joining : t.matches.acceptChallenge}
              </button>
            </div>
          ) : (currentUserId === match.challenger_id || !currentUserId) && (
            <div className="border border-[#14110F] p-6 text-center">
              <Loader2 size={28} className="animate-spin mx-auto mb-3" />
              <p className="font-bold mb-1">{t.matches.waitingOpponent}</p>
              <p className="text-[#4A3F2C] text-sm font-medium mt-1">{t.matches.shareHint}</p>
              <div className="flex flex-col items-center gap-2 mt-4">
                <button onClick={shareMatch} className="flex items-center gap-2 text-sm border border-amber-700 hover:bg-amber-50 text-amber-700 font-bold px-5 py-2.5 transition-colors cursor-pointer">
                  {copied ? <><Check size={14} /> {t.common.copied}</> : <><Share2 size={14} /> {t.matches.shareLink}</>}
                </button>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/matches/${id}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
                  className="flex items-center gap-2 text-xs text-[#6B5D42] hover:text-[#14110F] px-4 py-1.5 transition-colors cursor-pointer"
                >
                  <Copy size={11} /> {t.matches.copyLink}
                </button>
              </div>
              {currentUserId === match.challenger_id && (
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
                    {cancelling ? t.matches.cancelling : cancelConfirm ? t.matches.cancelConfirm : t.matches.cancelChallenge}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── OPEN (non-open-lobby team game): waiting + share for creator ── */}
      {match.status === "open" && isTeamGame && !isOpenLobby && currentUserId === match.challenger_id && (
        <div className="border border-[#14110F] p-5 mt-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Users size={14} className="text-[#6B5D42]" />
            <p className="text-sm font-bold">
              {match.slots_challenger}/{match.team_size} vs {match.slots_opponent}/{match.team_size}
            </p>
          </div>
          <p className="text-[#4A3F2C] text-xs font-medium mb-3">{t.matches.waitingTeam}</p>
          <button onClick={shareMatch} className="flex items-center gap-2 text-sm border border-amber-700 hover:bg-amber-50 text-amber-700 font-bold px-5 py-2 transition-colors cursor-pointer mx-auto">
            {copied ? <><Check size={14} /> {t.common.copied}</> : <><Share2 size={14} /> {t.matches.shareLink}</>}
          </button>
          <div className="mt-4">
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
              {cancelling ? t.matches.cancelling : cancelConfirm ? t.matches.cancelConfirm : t.matches.cancelChallenge}
            </button>
          </div>
        </div>
      )}
      {/* Report button — shown to non-challengers when match has an opponent */}
      {isParticipant && !isChallenger && match.status !== "cancelled" && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 text-xs text-[#6B5D42] hover:text-rose-700 font-semibold transition-colors cursor-pointer"
          >
            <Flag size={11} /> Report user
          </button>
        </div>
      )}

      {showReport && match.opponent_id && (
        <ReportModal
          reportedUserId={isChallenger ? (match.opponent_id ?? "") : match.challenger_id}
          matchId={id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
