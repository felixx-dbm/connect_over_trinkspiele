"use client";

import { useState } from "react";
import { MapPin, Trophy, Medal, Users, TrendingUp, Crown } from "lucide-react";

type Player = { rank: number; id: string; username: string; wins: number; losses: number };
type Crew   = { rank: number; id: string; name: string; wins: number };

type Props = {
  players: Player[];
  crews: Crew[];
  city: string | null;
  currentUserId: string;
};

const PODIUM = [
  { color: "from-amber-400 to-yellow-300",  border: "border-amber-300",  text: "text-amber-700",  bg: "bg-amber-50",  icon: <Trophy size={18} className="text-amber-600" />, label: "1st" },
  { color: "from-slate-400 to-stone-300",   border: "border-slate-300",  text: "text-slate-600",  bg: "bg-slate-50",  icon: <Medal  size={16} className="text-slate-500"  />, label: "2nd" },
  { color: "from-orange-500 to-amber-400",  border: "border-orange-300", text: "text-orange-700", bg: "bg-orange-50", icon: <Medal  size={14} className="text-orange-500" />, label: "3rd" },
];

export default function LeaderboardClient({ players, crews, city, currentUserId }: Props) {
  const [tab, setTab] = useState<"city" | "crews">("city");

  const list = tab === "city" ? players : crews;
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl text-stone-900">
          LEADER<span className="text-gradient">BOARD</span>
        </h1>
        {city && (
          <div className="flex items-center gap-1.5 bg-white border border-amber-100 px-3 py-1.5 rounded-full text-xs text-stone-600 font-bold shadow-sm">
            <MapPin size={11} className="text-amber-500" />
            {city}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 bg-white border border-amber-100 p-1 rounded-2xl shadow-sm">
        {(["city", "crews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              tab === t ? "btn-gold" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {t === "city" ? <Trophy size={14} /> : <Users size={14} />}
            {t === "city" ? "Players" : "Crews"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-stone-500 text-sm font-semibold">
            {city
              ? `No ${tab === "city" ? "players" : "crews"} in ${city} yet.`
              : "Set your city in your profile to see local rankings."}
          </p>
        </div>
      ) : (
        <>
          {top3.length >= 2 && (
            <div className="grid grid-cols-3 gap-2 mb-6 items-end">
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return <div key={i} />;
                const podiumIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
                const { color, border, text, bg, icon, label } = PODIUM[podiumIdx];
                const heights = ["h-28", "h-36", "h-24"];
                const name = "username" in entry ? entry.username : entry.name;
                const isMe = "id" in entry && entry.id === currentUserId;

                return (
                  <div key={entry.id} className={`flex flex-col items-center ${heights[i]}`}>
                    <div className="flex flex-col items-center gap-1 mb-1">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center font-display text-white text-sm shadow-md ${isMe ? "ring-2 ring-offset-1 ring-amber-500" : ""}`}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-stone-700 text-xs font-bold truncate max-w-[68px] text-center">{name}</p>
                      <p className="text-stone-500 text-xs font-semibold">{entry.wins}W</p>
                    </div>
                    <div className={`w-full flex-1 rounded-t-2xl ${bg} border-t border-x ${border} flex flex-col items-center justify-center gap-1`}>
                      {icon}
                      <span className={`text-xs font-extrabold ${text}`}>{label}</span>
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
                  className={`flex items-center gap-3 rounded-2xl p-3 border shadow-sm ${
                    isMe ? "bg-amber-50 border-amber-200" : "bg-white border-amber-100 hover:border-amber-200"
                  }`}
                >
                  <span className="w-6 text-center font-display text-stone-400 text-sm">{entry.rank}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display text-xs flex-shrink-0 ${
                    isMe
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
                      : "bg-stone-100 border border-stone-200 text-stone-600"
                  }`}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? "text-amber-700" : "text-stone-800"}`}>{name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-stone-600">
                    <TrendingUp size={12} className="text-stone-400" />
                    <span>{entry.wins}</span>
                    <span className="text-stone-400 text-xs font-semibold">{tab === "crews" ? "combined" : "W"}</span>
                  </div>
                  {isMe && <Crown size={12} className="text-amber-500 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
