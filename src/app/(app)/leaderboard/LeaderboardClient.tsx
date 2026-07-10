"use client";

import { useState } from "react";
import { MapPin, Trophy, Medal, Users, TrendingUp, Crown } from "lucide-react";
import { useT } from "@/components/LanguageProvider";

type Player = { rank: number; id: string; username: string; wins: number; losses: number };
type Crew   = { rank: number; id: string; name: string; wins: number };

type Props = {
  players: Player[];
  crews: Crew[];
  city: string | null;
  currentUserId: string;
};

const PODIUM_BASE = [
  { bg: "bg-amber-500",  border: "border-amber-600",  text: "text-amber-700",  icon: <Trophy size={18} className="text-amber-600" /> },
  { bg: "bg-stone-400",  border: "border-stone-500",  text: "text-stone-600",  icon: <Medal  size={16} className="text-stone-500"  /> },
  { bg: "bg-orange-700", border: "border-orange-800", text: "text-orange-700", icon: <Medal  size={14} className="text-orange-700" /> },
];

export default function LeaderboardClient({ players, crews, city, currentUserId }: Props) {
  const t = useT();
  const [tab, setTab] = useState<"city" | "crews">("city");

  const PODIUM = PODIUM_BASE.map((p, i) => ({ ...p, label: t.leaderboard.podium[i] }));
  const list = tab === "city" ? players : crews;
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow mb-1">{t.leaderboard.title}</p>
          <h1 className="display text-3xl">{t.leaderboard.titleAccent}</h1>
        </div>
        {city && (
          <div className="flex items-center gap-1.5 border border-[#14110F] px-3 py-1.5 text-xs font-bold">
            <MapPin size={11} className="text-amber-700" />
            {city}
          </div>
        )}
      </div>

      <div className="flex gap-0 mb-6 border border-[#14110F]">
        {(["city", "crews"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 h-11 flex items-center justify-center gap-2 text-sm font-bold transition-colors cursor-pointer ${
              tab === tabKey ? "bg-[#14110F] text-[#FAF8F3]" : "text-[#4A3F2C] hover:text-[#14110F]"
            }`}
          >
            {tabKey === "city" ? <Trophy size={14} /> : <Users size={14} />}
            {tabKey === "city" ? t.leaderboard.tabPlayers : t.leaderboard.tabCrews}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 border-t border-b border-[#14110F]">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-[#4A3F2C] text-sm font-medium">
            {city
              ? t.leaderboard.noEntries
                  .replace("{tab}", tab === "city" ? t.leaderboard.tabPlayers : t.leaderboard.tabCrews)
                  .replace("{city}", city)
              : t.leaderboard.noCity}
          </p>
        </div>
      ) : (
        <>
          {top3.length >= 2 && (
            <div className="grid grid-cols-3 gap-2 mb-6 items-end">
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return <div key={i} />;
                const podiumIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
                const { bg, border, text, icon, label } = PODIUM[podiumIdx];
                const heights = ["h-28", "h-36", "h-24"];
                const name = "username" in entry ? entry.username : entry.name;
                const isMe = "id" in entry && entry.id === currentUserId;

                return (
                  <div key={entry.id} className={`flex flex-col items-center ${heights[i]}`}>
                    <div className="flex flex-col items-center gap-1 mb-1">
                      <div className={`w-11 h-11 ${bg} flex items-center justify-center display-upright text-white text-sm ${isMe ? "ring-2 ring-offset-1 ring-[#14110F]" : ""}`}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-xs font-bold truncate max-w-[68px] text-center">{name}</p>
                      <p className="text-[#4A3F2C] text-xs font-medium">{entry.wins}W</p>
                    </div>
                    <div className={`w-full flex-1 border-t-2 border-x ${border} flex flex-col items-center justify-center gap-1`}>
                      {icon}
                      <span className={`text-xs font-extrabold ${text}`}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
            {rest.map((entry) => {
              const name = "username" in entry ? entry.username : entry.name;
              const isMe = "id" in entry && entry.id === currentUserId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 py-3 ${isMe ? "bg-amber-50" : ""}`}
                >
                  <span className="w-6 text-center display text-[#6B5D42] text-sm">{entry.rank}</span>
                  <div className={`w-9 h-9 flex items-center justify-center display-upright text-xs flex-shrink-0 ${
                    isMe
                      ? "bg-[#14110F] text-[#FAF8F3]"
                      : "border border-[#E3DCCB] text-[#4A3F2C]"
                  }`}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? "text-amber-700" : ""}`}>{name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold">
                    <TrendingUp size={12} className="text-[#6B5D42]" />
                    <span>{entry.wins}</span>
                    <span className="text-[#6B5D42] text-xs font-medium">{tab === "crews" ? t.leaderboard.combined : t.leaderboard.winsShort}</span>
                  </div>
                  {isMe && <Crown size={12} className="text-amber-600 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
