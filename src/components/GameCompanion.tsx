"use client";

import { useState, useEffect, useRef } from "react";
import { Swords, RefreshCw, Play, Pause, Plus, Minus, Timer, RotateCcw, ChevronDown, ChevronUp, Trash2, Clock } from "lucide-react";

type GameCompanionProps = {
  gameType: string;
  matchId: string;
  challengerName: string;
  opponentName: string;
  isChallenger: boolean;
};

const LOCALIZED = {
  de: {
    title: "🎯 Live Spiel-Assistent",
    reset: "Zurücksetzen",
    cupsLeft: "Becher verbleibend",
    beerPongTitle: "Beer Pong Becher-Tracker",
    flunkyballTitle: "Flunkyball Trinkzeit-Messer",
    freestyleTitle: "Punktezähler & Timer",
    we: "Wir",
    opp: "Gegner",
    chugSelf: "🍺 WIR TRINKEN!",
    chugOpp: "⏱️ GEGNER TRINKT!",
    stop: "STOPP!",
    chugLogs: "Trinkzeit-Protokoll",
    duration: "Zeit",
    activeChugging: "Trinkphase läuft...",
    points: "Punkte",
    timer: "Timer / Countdown",
    start: "Start",
    pause: "Pause",
    sec: "Sekunden",
    hint: "Tippe auf die Becher, um sie als getroffen zu markieren. Ideal zum Aufstellen des Handys auf dem Tisch!",
    flunkyHint: "Starte den Timer, sobald die Flasche umgeworfen wird, und stoppe ihn, wenn sie wieder steht.",
    round: "Wurf",
    noLogs: "Noch keine Trinkzeiten erfasst.",
    clearLogs: "Protokoll löschen",
  },
  en: {
    title: "🎯 Live Game Companion",
    reset: "Reset",
    cupsLeft: "cups remaining",
    beerPongTitle: "Beer Pong Cup Tracker",
    flunkyballTitle: "Flunkyball Chug Timer",
    freestyleTitle: "Score & Timer",
    we: "We",
    opp: "Opponent",
    chugSelf: "🍺 WE CHUG!",
    chugOpp: "⏱️ OPPONENT CHUGS!",
    stop: "STOP!",
    chugLogs: "Chug Time Logs",
    duration: "Time",
    activeChugging: "Drinking phase active...",
    points: "Points",
    timer: "Timer / Countdown",
    start: "Start",
    pause: "Pause",
    sec: "Seconds",
    hint: "Tap cups to mark them as hit. Place your phone on the table to track live!",
    flunkyHint: "Start the timer when the bottle is hit, and stop it when it is set back up.",
    round: "Throw",
    noLogs: "No chug logs recorded yet.",
    clearLogs: "Clear Logs",
  }
};

type ChugLog = {
  id: string;
  team: "challenger" | "opponent";
  timeMs: number;
  timestamp: string;
};

export default function GameCompanion({
  gameType,
  matchId,
  challengerName,
  opponentName,
  isChallenger
}: GameCompanionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [lang, setLang] = useState<"de" | "en">("de");

  // Determine current language from document cookie
  useEffect(() => {
    const locale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lang="))
      ?.split("=")[1];
    setLang(locale === "de" ? "de" : "en");
  }, []);

  const t = LOCALIZED[lang];

  // 1. BEER PONG STATE
  const [myCups, setMyCups] = useState<boolean[]>(Array(10).fill(true));
  const [oppCups, setOppCups] = useState<boolean[]>(Array(10).fill(true));

  // 2. FLUNKYBALL STATE
  const [chugLogs, setChugLogs] = useState<ChugLog[]>([]);
  const [chugRunning, setChugRunning] = useState<"challenger" | "opponent" | null>(null);
  const [chugTime, setChugTime] = useState(0);
  const chugIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 3. FREESTYLE STATE
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [countdownActive, setCountdownActive] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`prost_game_state_${matchId}`);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.myCups) setMyCups(data.myCups);
        if (data.oppCups) setOppCups(data.oppCups);
        if (data.chugLogs) setChugLogs(data.chugLogs);
        if (data.myScore !== undefined) setMyScore(data.myScore);
        if (data.oppScore !== undefined) setOppScore(data.oppScore);
        if (data.countdown !== undefined) setCountdown(data.countdown);
      }
    } catch (e) {
      console.error("Failed to load local game companion state", e);
    }
  }, [matchId]);

  // Save state to localStorage on changes
  useEffect(() => {
    try {
      const state = { myCups, oppCups, chugLogs, myScore, oppScore, countdown };
      localStorage.setItem(`prost_game_state_${matchId}`, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save local game companion state", e);
    }
  }, [matchId, myCups, oppCups, chugLogs, myScore, oppScore, countdown]);

  // Chug Timer tick
  useEffect(() => {
    if (chugRunning !== null) {
      const startTime = Date.now() - chugTime;
      chugIntervalRef.current = setInterval(() => {
        setChugTime(Date.now() - startTime);
      }, 37); // ~27 FPS updates
    } else {
      if (chugIntervalRef.current) clearInterval(chugIntervalRef.current);
    }
    return () => {
      if (chugIntervalRef.current) clearInterval(chugIntervalRef.current);
    };
  }, [chugRunning]);

  // Countdown timer tick
  useEffect(() => {
    if (countdownActive) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCountdownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [countdownActive]);

  // Clean game type matching
  const isBeerPong = gameType === "beer_pong";
  const isFlunkyball = gameType === "flunky_ball";

  // Helpers
  const toggleCup = (side: "me" | "opp", index: number) => {
    if (side === "me") {
      setMyCups((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        return next;
      });
    } else {
      setOppCups((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        return next;
      });
    }
  };

  const resetCups = () => {
    setMyCups(Array(10).fill(true));
    setOppCups(Array(10).fill(true));
  };

  const startChugTimer = (team: "challenger" | "opponent") => {
    setChugTime(0);
    setChugRunning(team);
  };

  const stopChugTimer = () => {
    if (chugRunning === null) return;
    const newLog: ChugLog = {
      id: Math.random().toString(36).slice(2, 9),
      team: chugRunning,
      timeMs: chugTime,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setChugLogs((prev) => [newLog, ...prev]);
    setChugRunning(null);
    setChugTime(0);
  };

  const clearChugLogs = () => {
    setChugLogs([]);
  };

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${sec}.${tenths}s`;
  };

  // Row mappings for Beer Pong cups layout (Triangle representation)
  // Back Row: 4 cups, 3rd Row: 3 cups, 2nd Row: 2 cups, Front Row: 1 cup
  const rows = [
    [0, 1, 2, 3], // Row 4 (base)
    [4, 5, 6],    // Row 3
    [7, 8],       // Row 2
    [9]           // Row 1 (tip)
  ];

  // Names representing sides (respecting if the current user is the challenger or opponent)
  const myDisplayName = isChallenger ? challengerName : (opponentName === "Waiting…" ? t.opp : opponentName);
  const oppDisplayName = isChallenger ? (opponentName === "Waiting…" ? t.opp : opponentName) : challengerName;

  const myCupsLeft = myCups.filter(Boolean).length;
  const oppCupsLeft = oppCups.filter(Boolean).length;

  return (
    <div className="border border-[#14110F] bg-[#FAF8F3] mb-6">
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#14110F] text-[#FAF8F3] hover:bg-[#322C24] transition-colors cursor-pointer"
      >
        <span className="font-display italic text-base flex items-center gap-2">
          {t.title}
        </span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {isOpen && (
        <div className="p-4">
          {/* A. BEER PONG MODULE */}
          {isBeerPong && (
            <div>
              <h3 className="eyebrow text-xs mb-1">{t.beerPongTitle}</h3>
              <p className="text-[#6B5D42] text-[11px] mb-6 leading-tight">{t.hint}</p>

              <div className="grid grid-cols-2 gap-6 relative">
                {/* Visual partition line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#E3DCCB] -translate-x-1/2" />

                {/* Left Side: My Cups (tip points to center) */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-amber-700 truncate max-w-full mb-1">
                    {myDisplayName}
                  </span>
                  <span className="display text-lg text-[#14110F] mb-4">
                    {myCupsLeft} {t.cupsLeft}
                  </span>

                  {/* Render Triangle (pointing down) */}
                  <div className="flex flex-col gap-2.5 items-center">
                    {rows.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-2.5">
                        {row.map((cupIdx) => (
                          <button
                            key={cupIdx}
                            onClick={() => toggleCup("me", cupIdx)}
                            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                              myCups[cupIdx]
                                ? "bg-rose-600 border-rose-800 text-white shadow-sm shadow-rose-900/30 scale-100"
                                : "bg-[#FAF8F3] border-[#E3DCCB] text-[#C9BFA8] opacity-35 scale-95"
                            }`}
                          >
                            {cupIdx + 1}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Opponent Cups (tip points to center) */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-[#14110F] truncate max-w-full mb-1">
                    {oppDisplayName}
                  </span>
                  <span className="display text-lg text-[#6B5D42] mb-4">
                    {oppCupsLeft} {t.cupsLeft}
                  </span>

                  {/* Render Triangle (pointing down) */}
                  <div className="flex flex-col gap-2.5 items-center">
                    {rows.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-2.5">
                        {row.map((cupIdx) => (
                          <button
                            key={cupIdx}
                            onClick={() => toggleCup("opp", cupIdx)}
                            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                              oppCups[cupIdx]
                                ? "bg-[#14110F] border-[#322C24] text-[#FAF8F3] shadow-sm scale-100"
                                : "bg-[#FAF8F3] border-[#E3DCCB] text-[#C9BFA8] opacity-35 scale-95"
                            }`}
                          >
                            {cupIdx + 1}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset Action */}
              <div className="mt-6 pt-4 border-t border-[#E3DCCB] flex justify-end">
                <button
                  onClick={resetCups}
                  className="flex items-center gap-1.5 text-xs text-[#6B5D42] hover:text-[#14110F] font-bold border border-[#E3DCCB] px-3 py-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  {t.reset}
                </button>
              </div>
            </div>
          )}

          {/* B. FLUNKYBALL MODULE */}
          {isFlunkyball && (
            <div>
              <h3 className="eyebrow text-xs mb-1">{t.flunkyballTitle}</h3>
              <p className="text-[#6B5D42] text-[11px] mb-4 leading-tight">{t.flunkyHint}</p>

              {/* Live Timer Visual */}
              <div className="border border-[#14110F] bg-white py-6 mb-5 text-center">
                <span className="font-display italic text-4xl block font-medium tabular-nums tracking-wide text-[#14110F]">
                  {chugRunning !== null ? formatTime(chugTime) : "0.0s"}
                </span>
                {chugRunning !== null && (
                  <span className="text-[10px] uppercase font-bold tracking-widest text-rose-700 animate-pulse mt-1 inline-block">
                    {t.activeChugging} ({chugRunning === "challenger" ? myDisplayName : oppDisplayName})
                  </span>
                )}
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {chugRunning !== null ? (
                  <button
                    onClick={stopChugTimer}
                    className="col-span-2 h-14 bg-rose-700 border-rose-800 text-white font-bold text-base cursor-pointer flex items-center justify-center gap-2 hover:bg-rose-800 transition-colors"
                  >
                    <Pause size={18} />
                    {t.stop}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => startChugTimer("challenger")}
                      className="h-14 border border-amber-700 hover:bg-amber-50 text-amber-700 font-bold text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Play size={14} />
                      {t.chugSelf}
                    </button>
                    <button
                      onClick={() => startChugTimer("opponent")}
                      className="h-14 border border-[#14110F] hover:bg-stone-100 text-[#14110F] font-bold text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Play size={14} />
                      {t.chugOpp}
                    </button>
                  </>
                )}
              </div>

              {/* Chug History Log */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="eyebrow text-xs">{t.chugLogs}</h4>
                  {chugLogs.length > 0 && (
                    <button
                      onClick={clearChugLogs}
                      className="text-[10px] text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={10} />
                      {t.clearLogs}
                    </button>
                  )}
                </div>

                {chugLogs.length === 0 ? (
                  <div className="border border-[#E3DCCB] border-dashed p-4 text-center text-xs text-[#6B5D42] font-semibold">
                    {t.noLogs}
                  </div>
                ) : (
                  <div className="border border-[#14110F] divide-y divide-[#E3DCCB] max-h-48 overflow-y-auto">
                    {chugLogs.map((log, index) => {
                      const isMe = log.team === "challenger";
                      return (
                        <div key={log.id} className="flex justify-between items-center px-4 py-2.5 bg-white text-xs">
                          <span className="font-semibold text-[#4A3F2C]">
                            {t.round} {chugLogs.length - index}
                          </span>
                          <span className={`font-bold px-2 py-0.5 ${isMe ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-900"}`}>
                            {isMe ? myDisplayName : oppDisplayName}
                          </span>
                          <span className="font-display italic text-sm font-semibold tabular-nums text-[#14110F]">
                            {formatTime(log.timeMs)}
                          </span>
                          <span className="text-[10px] text-[#C9BFA8] font-medium flex items-center gap-1">
                            <Clock size={9} />
                            {log.timestamp}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. FREESTYLE / GENERIC SCOREBOARD & TIMER */}
          {!isBeerPong && !isFlunkyball && (
            <div>
              <h3 className="eyebrow text-xs mb-3">{t.freestyleTitle}</h3>

              {/* Point Counter */}
              <div className="grid grid-cols-2 gap-4 mb-6 border border-[#E3DCCB] p-4 bg-white">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-amber-700 truncate max-w-full mb-1">
                    {myDisplayName}
                  </span>
                  <span className="font-display text-4xl italic font-bold my-1 text-[#14110F] tabular-nums">
                    {myScore}
                  </span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setMyScore((s) => Math.max(0, s - 1))}
                      className="w-9 h-8 border border-[#E3DCCB] flex items-center justify-center text-[#14110F] hover:bg-stone-50 cursor-pointer font-bold"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => setMyScore((s) => s + 1)}
                      className="w-9 h-8 bg-[#14110F] text-[#FAF8F3] flex items-center justify-center hover:bg-stone-800 cursor-pointer font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center border-l border-[#E3DCCB]">
                  <span className="text-xs font-bold text-[#14110F] truncate max-w-full mb-1">
                    {oppDisplayName}
                  </span>
                  <span className="font-display text-4xl italic font-bold my-1 text-[#6B5D42] tabular-nums">
                    {oppScore}
                  </span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setOppScore((s) => Math.max(0, s - 1))}
                      className="w-9 h-8 border border-[#E3DCCB] flex items-center justify-center text-[#14110F] hover:bg-stone-50 cursor-pointer font-bold"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => setOppScore((s) => s + 1)}
                      className="w-9 h-8 bg-[#14110F] text-[#FAF8F3] flex items-center justify-center hover:bg-stone-800 cursor-pointer font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="border border-[#14110F] p-4 bg-white">
                <h4 className="eyebrow text-[10px] mb-2">{t.timer}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-2xl italic font-bold tabular-nums text-[#14110F]">
                      {countdown}
                    </span>
                    <span className="text-[10px] font-semibold text-[#6B5D42]">{t.sec}</span>
                  </div>

                  <div className="flex gap-1.5">
                    {/* Presets */}
                    {!countdownActive && (
                      <div className="flex gap-1 mr-2">
                        {[30, 60, 120].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => setCountdown(sec)}
                            className={`text-[10px] font-extrabold border px-2 py-1 cursor-pointer transition-colors ${
                              countdown === sec ? "bg-[#14110F] text-[#FAF8F3] border-[#14110F]" : "border-[#E3DCCB] text-[#6B5D42] hover:border-[#14110F]"
                            }`}
                          >
                            {sec === 120 ? "2m" : `${sec}s`}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timer controls */}
                    <button
                      onClick={() => setCountdownActive((a) => !a)}
                      className={`px-3 py-1 flex items-center justify-center gap-1 text-xs font-bold cursor-pointer text-white ${
                        countdownActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {countdownActive ? <Pause size={10} /> : <Play size={10} />}
                      {countdownActive ? t.pause : t.start}
                    </button>
                    <button
                      onClick={() => {
                        setCountdownActive(false);
                        setCountdown(60);
                      }}
                      className="p-1 border border-[#E3DCCB] text-[#6B5D42] hover:border-[#14110F] cursor-pointer flex items-center justify-center"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset counters */}
              <div className="mt-6 pt-4 border-t border-[#E3DCCB] flex justify-end">
                <button
                  onClick={() => {
                    setMyScore(0);
                    setOppScore(0);
                    setCountdown(60);
                    setCountdownActive(false);
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#6B5D42] hover:text-[#14110F] font-bold border border-[#E3DCCB] px-3 py-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  {t.reset}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
