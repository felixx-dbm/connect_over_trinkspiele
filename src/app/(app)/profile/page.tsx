import Link from "next/link";
import { Settings, MapPin, Trophy, Swords, TrendingUp, Clock, ChevronRight, Edit3, Users } from "lucide-react";

const recentMatches = [
  { id: "1", opponent: "BierKönig", game: "Beer Pong", result: "win", ago: "2h ago" },
  { id: "2", opponent: "FlunkyPro", game: "Flunky Ball", result: "loss", ago: "1d ago" },
  { id: "3", opponent: "KegLord", game: "Beer Pong", result: "win", ago: "2d ago" },
];

export default function ProfilePage() {
  const user = {
    name: "BeerHero",
    initials: "BH",
    city: "Munich",
    wins: 47,
    losses: 12,
    winRate: 80,
    streak: 3,
    crew: "BierBrigade",
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-xl text-zinc-100">
          MY <span className="text-amber-400">PROFILE</span>
        </h1>
        <button className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors cursor-pointer">
          <Settings size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center font-display text-zinc-950 text-xl">
              {user.initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors">
              <Edit3 size={10} className="text-zinc-400" />
            </button>
          </div>
          <div>
            <h2 className="font-display text-2xl text-zinc-100">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-zinc-500 text-xs">
                <MapPin size={11} />
                {user.city}
              </div>
              <span className="text-zinc-700">·</span>
              <div className="flex items-center gap-1 text-zinc-500 text-xs">
                <Users size={11} />
                {user.crew}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Wins", value: user.wins, icon: Trophy, color: "text-amber-400" },
            { label: "Losses", value: user.losses, icon: Swords, color: "text-zinc-400" },
            { label: "Win Rate", value: `${user.winRate}%`, icon: TrendingUp, color: "text-green-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-800 rounded-xl p-3 text-center">
              <Icon size={14} className={`${color} mx-auto mb-1`} />
              <p className={`font-display text-xl ${color}`}>{value}</p>
              <p className="text-zinc-600 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Win streak badge */}
      <div className="bg-zinc-900 border border-orange-500/20 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
          <span className="text-orange-400 text-sm font-display">{user.streak}</span>
        </div>
        <div>
          <p className="text-zinc-200 text-sm font-medium">Current win streak</p>
          <p className="text-zinc-600 text-xs">Keep playing to extend it</p>
        </div>
        <TrendingUp size={16} className="text-orange-400 ml-auto" />
      </div>

      {/* Quick links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-5">
        {[
          { label: "My Crew", sublabel: user.crew, Icon: Users, href: "/crews" },
          { label: "Leaderboard", sublabel: "#5 in Munich", Icon: Trophy, href: "/leaderboard" },
          { label: "Settings", sublabel: "Account & preferences", Icon: Settings, href: "#" },
        ].map(({ label, sublabel, Icon, href }, i) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors cursor-pointer ${
              i !== 0 ? "border-t border-zinc-800" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-zinc-200 text-sm font-medium">{label}</p>
              <p className="text-zinc-600 text-xs">{sublabel}</p>
            </div>
            <ChevronRight size={14} className="text-zinc-700" />
          </Link>
        ))}
      </div>

      {/* Recent matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Recent Battles</p>
          <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer">See all</button>
        </div>
        <div className="flex flex-col gap-2">
          {recentMatches.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 transition-all cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs flex-shrink-0 ${
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
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Clock size={11} className="text-zinc-700" />
                <span className="text-zinc-600 text-xs">{match.ago}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
