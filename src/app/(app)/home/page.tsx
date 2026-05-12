import Link from "next/link";
import { Bell, Swords, Trophy, TrendingUp, Clock, ChevronRight, Flame, Users } from "lucide-react";

const recentMatches = [
  { id: "1", opponent: "BierKönig", game: "Beer Pong", result: "win", ago: "2h ago" },
  { id: "2", opponent: "FlunkyPro", game: "Flunky Ball", result: "loss", ago: "1d ago" },
  { id: "3", opponent: "KegLord", game: "Beer Pong", result: "win", ago: "2d ago" },
  { id: "4", opponent: "TrinkMaster", game: "Freestyle", result: "win", ago: "3d ago" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-zinc-500 text-sm mb-0.5">Good evening,</p>
          <h1 className="font-display text-2xl text-zinc-100">
            BIER<span className="text-amber-400">HERO</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors cursor-pointer">
            <Bell size={18} className="text-zinc-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
          </button>
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-display text-zinc-950 text-sm">
            BH
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Wins", value: "47", icon: Trophy, color: "text-amber-400" },
          { label: "Losses", value: "12", icon: Swords, color: "text-zinc-400" },
          { label: "Win Rate", value: "80%", icon: TrendingUp, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center gap-1"
          >
            <Icon size={16} className={color} />
            <span className={`font-display text-xl ${color}`}>{value}</span>
            <span className="text-zinc-600 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Active match banner */}
      <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-4 mb-6 amber-glow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-zinc-400 uppercase tracking-widest">Live Match</span>
          </div>
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Beer Pong</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-display text-zinc-950 text-sm mb-1 mx-auto">BH</div>
            <p className="text-xs text-zinc-300 font-medium">You</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-amber-400 text-xl">VS</span>
            <span className="text-xs text-zinc-600">In progress</span>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-display text-zinc-300 text-sm mb-1 mx-auto">KL</div>
            <p className="text-xs text-zinc-300 font-medium">KegLord</p>
          </div>
        </div>
        <Link
          href="/matches/active-1"
          className="mt-3 w-full h-10 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-xl transition-all cursor-pointer"
        >
          Go to match
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/matches/new"
          className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 rounded-2xl p-4 flex items-center gap-3 font-bold text-sm transition-all active:scale-[0.97] cursor-pointer amber-glow"
        >
          <Swords size={20} />
          Find Battle
        </Link>
        <Link
          href="/crews"
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-2xl p-4 flex items-center gap-3 font-medium text-sm transition-all cursor-pointer"
        >
          <Users size={20} className="text-amber-400" />
          My Crew
        </Link>
      </div>

      {/* Streak */}
      <div className="bg-zinc-900 border border-orange-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
          <Flame size={20} className="text-orange-400" />
        </div>
        <div className="flex-1">
          <p className="text-zinc-100 font-semibold text-sm">3-game win streak!</p>
          <p className="text-zinc-500 text-xs">Keep it going — find your next opponent</p>
        </div>
        <ChevronRight size={16} className="text-zinc-600" />
      </div>

      {/* Recent matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm text-zinc-400 uppercase tracking-widest">Recent Battles</h2>
          <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer">See all</button>
        </div>
        <div className="flex flex-col gap-2">
          {recentMatches.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 transition-all cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs ${
                match.result === "win"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700"
              }`}>
                {match.result === "win" ? "W" : "L"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 text-sm font-medium truncate">vs {match.opponent}</p>
                <p className="text-zinc-600 text-xs">{match.game}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Clock size={12} className="text-zinc-700" />
                <span className="text-zinc-600 text-xs">{match.ago}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
