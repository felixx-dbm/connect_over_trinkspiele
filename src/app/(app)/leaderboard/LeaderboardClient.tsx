"use client";

import { useState } from "react";
import { MapPin, Trophy, Medal, Users, TrendingUp } from "lucide-react";

type Player = { rank: number; id: string; username: string; wins: number; losses: number };
type Crew = { rank: number; id: string; name: string; wins: number };

type Props = {
  players: Player[];
  crews: Crew[];
  city: string | null;
  currentUserId: string;
};

const PODIUM_STYLES = [
  "from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-400",
  "from-zinc-400/20 to-zinc-400/5 border-zinc-400/40 text-zinc-400",
  "from-orange-700/20 to-orange-700/5 border-orange-700/40 text-orange-600",
];

export default function LeaderboardClient({ players, crews, city, currentUserId }: Props) {
  const [tab, setTab] = useState<"city" | "crews">("city");

  const list = tab === "city" ? players : crews;
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl text-zinc-100">
          LEADER<span className="text-amber-400">BOARD</span>
        </h1>
        {city && (
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-400">
            <MapPin size={11} className="text-amber-400" />
            {city}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
        {(["city", "crews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === t ? "bg-amber-500 text-zinc-950" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "city" ? <Trophy size={14} /> : <Users size={14} />}
            {t === "city" ? "Players" : "Crews"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16">
          <Trophy size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">
            {city ? `No ${tab === "city" ? "players" : "crews"} in ${city} yet.` : "Set your city in your profile to see local rankings."}
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 2 && (
            <div className="grid grid-cols-3 gap-2 mb-6 items-end">
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return <div key={i} />;
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const colorClass = PODIUM_STYLES[actualRank - 1];
                const heights = ["h-24", "h-32", "h-20"];
                const name = "username" in entry ? entry.username : entry.name;

                return (
                  <div key={entry.id} className={`flex flex-col items-center gap-2 ${heights[i]}`}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} border flex items-center justify-center font-display text-sm ${
                        "id" in entry && entry.id === currentUserId ? "ring-2 ring-amber-400" : ""
                      }`}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-zinc-300 text-xs font-medium truncate max-w-[72px] text-center">{name}</p>
                      <p className="text-zinc-500 text-xs">{entry.wins}W</p>
                    </div>
                    <div className={`w-full flex-1 rounded-t-xl bg-gradient-to-t ${colorClass.split(" ").slice(0, 2).join(" ")} border-t border-x ${colorClass.split(" ")[2]} flex items-center justify-center`}>
                      <span className={colorClass.split(" ")[3]}>
                        {actualRank === 1 ? <Trophy size={20} /> : actualRank === 2 ? <Medal size={18} /> : <span className="text-base font-display">3</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {rest.map((entry) => {
              const name = "username" in entry ? entry.username : entry.name;
              const isMe = "id" in entry && entry.id === currentUserId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 rounded-xl p-3 border ${
                    isMe ? "bg-amber-500/5 border-amber-500/20" : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <span className="w-6 text-center font-display text-zinc-600 text-sm">{entry.rank}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs flex-shrink-0 ${
                    isMe ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? "text-amber-300" : "text-zinc-200"}`}>{name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400 text-sm">
                    <TrendingUp size={12} className="text-zinc-600" />
                    <span className="font-medium">{entry.wins}</span>
                    <span className="text-zinc-600 text-xs">W</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
