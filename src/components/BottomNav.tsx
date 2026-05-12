"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Plus, Trophy, User } from "lucide-react";

const tabs = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/map", label: "Map", Icon: MapPin },
  { href: "/matches/new", label: null, Icon: Plus, isCTA: true },
  { href: "/leaderboard", label: "Ranks", Icon: Trophy },
  { href: "/profile", label: "Me", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map(({ href, label, Icon, isCTA }) => {
          const active = pathname === href || (href !== "/home" && pathname.startsWith(href));

          if (isCTA) {
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 -mt-5 shadow-lg amber-glow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label="New match"
              >
                <Icon size={24} className="text-zinc-950" strokeWidth={2.5} />
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                active
                  ? "text-amber-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
                className="transition-all duration-200"
              />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
              {active && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
