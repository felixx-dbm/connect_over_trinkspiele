"use client";

import { useState } from "react";
import { MapPin, Trophy, Medal, Users, TrendingUp } from "lucide-react";

const cityPlayers = [
  { rank: 1, name: "BierKönig", wins: 143, winRate: 89, city: "Munich" },
  { rank: 2, name: "FlunkyGod", wins: 127, winRate: 84, city: "Munich" },
  { rank: 3, name: "KegLord", wins: 118, winRate: 79, city: "Munich" },
  { rank: 4, name: "TrinkMaster", wins: 94, winRate: 74, city: "Munich" },
  { rank: 5, name: "BeerHero", wins: 87, winRate: 71, city: "Munich" },
  { rank: 6, name: "PongPro", wins: 76, winRate: 68, city: "Munich" },
  { rank: 7, name: "SchaumKing", wins: 65, winRate: 65, city: "Munich" },
  { rank: 8, name: "HopsMaster", wins: 52, winRate: 60, city: "Munich" },
];

const crewRankings = [
  { rank: 1, name: "BierBrigade", wins: 412, members: 8, city: "Munich" },
  { rank: 2, name: "FlunkyMasters", wins: 378, members: 6, city: "Munich" },
  { rank: 3, name: "KegNation", wins: 334, members: 10, city: "Munich" },
  { rank: 4, name: "PongElite", wins: 287, members: 5, city: "Munich" },
  { rank: 5, name: "HopsCrew", wins: 241, members: 7, city: "Munich" },
];

const podiumColors = [
  "from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-400",
  "from-zinc-400/20 to-zinc-400/5 border-zinc-400/40 text-zinc-400",
  "from-orange-700/20 to-orange-700/5 border-orange-700/40 text-orange-600",
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"city" | "crews">("city");

  const list = tab === "city" ? cityPlayers : crewRankings;
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl text-zinc-100">
          LEADER<span className="text-amber-400">BOARD</span>
        </h1>
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-400">
          <MapPin size={11} className="text-amber-400" />
          Munich
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
        {(["city", "crews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all cursor-pointer capitalize ${
              tab === t
                ? "bg-amber-500 text-zinc-950"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "city" ? <Trophy size={14} /> : <Users size={14} />}
            {t === "city" ? "Players" : "Crews"}
          </button>
        ))}
      </div>

      {/* Podium top 3 */}
      <div className="grid grid-cols-3 gap-2 mb-6 items-end">
        {[top3[1], top3[0], top3[2]].map((player, i) => {
          const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
          const heights = ["h-24", "h-32", "h-20"];
          const colorClass = podiumColors[actualRank - 1];

          return (
            <div key={player.rank} className={`flex flex-col items-center gap-2 ${heights[i]}`}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} border flex items-center justify-center font-display text-sm`}>
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-zinc-300 text-xs font-medium truncate max-w-[72px] text-center leading-tight">
                  {player.name}
                </p>
                <p className="text-zinc-500 text-xs">{player.wins}W</p>
              </div>
              <div className={`w-full flex-1 rounded-t-xl bg-gradient-to-t ${colorClass.split(" ").slice(0,2).join(" ")} border-t border-x ${colorClass.split(" ").slice(2,3).join(" ")} flex items-center justify-center`}>
                <span className={`font-display text-lg ${colorClass.split(" ").slice(3).join(" ")}`}>
                  {actualRank === 1 ? (
                    <Trophy size={20} />
                  ) : actualRank === 2 ? (
                    <Medal size={18} />
                  ) : (
                    <span className="text-base">3</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of list */}
      <div className="flex flex-col gap-2">
        {rest.map((player) => (
          <div
            key={player.rank}
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3"
          >
            <span className="w-6 text-center font-display text-zinc-600 text-sm">{player.rank}</span>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-display text-zinc-400 text-xs flex-shrink-0">
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-200 text-sm font-medium truncate">{player.name}</p>
              {tab === "crews" && (
                <p className="text-zinc-600 text-xs flex items-center gap-1">
                  <Users size={10} />
                  {"members" in player ? player.members : 0} members
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-zinc-400 text-sm">
              <TrendingUp size={12} className="text-zinc-600" />
              <span className="font-medium">{player.wins}</span>
              <span className="text-zinc-600 text-xs">W</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
