"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Plus, CalendarDays, User } from "lucide-react";
import { useT } from "@/components/LanguageProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const tabs = [
    { href: "/home",        label: t.nav.home,   Icon: Home,         activeColor: "text-amber-500",   dotColor: "bg-amber-500"   },
    { href: "/map",         label: t.nav.map,    Icon: MapPin,       activeColor: "text-rose-500",    dotColor: "bg-rose-500"    },
    { href: "/matches/new", label: null,          Icon: Plus,         activeColor: "",                 dotColor: "",              isCTA: true },
    { href: "/events",      label: t.nav.events, Icon: CalendarDays, activeColor: "text-violet-500",  dotColor: "bg-violet-500"  },
    { href: "/profile",     label: t.nav.me,     Icon: User,         activeColor: "text-emerald-500", dotColor: "bg-emerald-500" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto bg-white/92 backdrop-blur-2xl rounded-[22px] border border-amber-100/80 shadow-2xl shadow-amber-200/40">
        <div className="flex items-center justify-around h-[62px] px-2">
          {tabs.map(({ href, label, Icon, activeColor, dotColor, isCTA }) => {
            const active = pathname === href || (href !== "/home" && pathname.startsWith(href));

            if (isCTA) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-center w-12 h-12 rounded-2xl btn-gold cursor-pointer shrink-0"
                  aria-label="New match"
                >
                  <Icon size={22} className="text-white" strokeWidth={2.5} />
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  active ? activeColor : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.5}
                  className="transition-all duration-200"
                />
                <span className={`text-[10px] tracking-wide transition-all ${active ? "font-extrabold" : "font-semibold"}`}>
                  {label}
                </span>
                {active && (
                  <span className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${dotColor}`} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
