"use client";

/**
 * Fixed bottom tab bar — main navigation between Home, Map, Events and Profile.
 * The center CTA switches to the user's live match while one is running.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, MapPin, Plus, CalendarDays, User, Swords } from "lucide-react";
import { useT } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let userId = "";

    const check = async () => {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }
      const { data } = await supabase
        .from("matches")
        .select("id")
        .eq("challenger_id", userId)
        .in("status", ["open", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLiveMatchId(data?.id ?? null);
    };

    check();
    const interval = setInterval(check, 10_000);
    return () => clearInterval(interval);
  }, [pathname]);

  const tabs = [
    { href: "/home",        label: t.nav.home,   Icon: Home,         activeColor: "text-amber-700",   dotColor: "bg-amber-500"   },
    { href: "/map",         label: t.nav.map,    Icon: MapPin,       activeColor: "text-rose-700",    dotColor: "bg-rose-500"    },
    { href: "/matches/new", label: null,          Icon: Plus,         activeColor: "",                 dotColor: "",              isCTA: true },
    { href: "/events",      label: t.nav.events, Icon: CalendarDays, activeColor: "text-violet-700",  dotColor: "bg-violet-500"  },
    { href: "/profile",     label: t.nav.me,     Icon: User,         activeColor: "text-emerald-700", dotColor: "bg-emerald-500" },
  ];

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto bg-[#FAF8F3]/95 backdrop-blur-xl border border-[#14110F]">
        <div className="flex items-center justify-around h-[62px] px-2">
          {tabs.map(({ href, label, Icon, activeColor, dotColor, isCTA }) => {
            const active = pathname === href || (href !== "/home" && pathname.startsWith(href));

            if (isCTA) {
              if (liveMatchId) {
                const liveActive = pathname === `/matches/${liveMatchId}`;
                return (
                  <Link
                    key="live-match"
                    href={`/matches/${liveMatchId}`}
                    className="relative flex items-center justify-center w-12 h-12 border border-emerald-700 bg-emerald-600 cursor-pointer shrink-0"
                    aria-label="View live match"
                  >
                    <Swords size={20} className="text-white" strokeWidth={2.5} />
                    {!liveActive && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#FAF8F3] animate-pulse" />
                    )}
                  </Link>
                );
              }
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-center w-12 h-12 btn-gold cursor-pointer shrink-0"
                  aria-label="New match"
                >
                  <Icon size={22} className="text-[#FAF8F3]" strokeWidth={2.5} />
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-2 transition-all duration-200 cursor-pointer ${
                  active ? activeColor : "text-[#6B5D42] hover:text-[#14110F]"
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
