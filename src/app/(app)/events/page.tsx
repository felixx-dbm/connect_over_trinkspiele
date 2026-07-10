"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Plus, Hash, ChevronRight, Zap } from "lucide-react";
import { useT } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

type Event = {
  id: string;
  name: string;
  join_code: string;
  city: string | null;
  created_by: string;
};

type Membership = {
  is_active: boolean;
  events: Event;
};

export default function EventsPage() {
  const t = useT();
  const router = useRouter();
  const [supabase] = useState(createClient);

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"create" | "join" | null>(null);

  // create form
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [creating, setCreating] = useState(false);

  // join form
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (ignore || !user) return;
      const { data } = await supabase
        .from("event_members")
        .select("is_active, events(id, name, join_code, city, created_by)")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });
      if (ignore) return;
      setMemberships((data ?? []) as unknown as Membership[]);
      setLoading(false);
    }
    load();
    return () => { ignore = true; };
  }, [supabase]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), city: city.trim() }),
    });
    const json = await res.json() as { id?: string; error?: string };
    setCreating(false);
    if (!res.ok || !json.id) { setError(json.error ?? "Failed"); return; }
    router.push(`/events/${json.id}`);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setJoining(true);
    const res = await fetch("/api/events/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ join_code: code.trim().toUpperCase() }),
    });
    const json = await res.json() as { id?: string; error?: string };
    setJoining(false);
    if (!res.ok || !json.id) { setError(json.error ?? "Not found"); return; }
    router.push(`/events/${json.id}`);
  }

  async function setActive(eventId: string, memberships: Membership[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("event_members")
      .update({ is_active: true })
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    // Optimistic update
    setMemberships(memberships.map((m) => ({
      ...m,
      is_active: m.events.id === eventId,
    })));
  }

  const activeEvent = memberships.find((m) => m.is_active)?.events;

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      <div className="mb-8">
        <p className="eyebrow mb-1">{t.events.title}</p>
        <h1 className="display text-3xl">{t.events.titleAccent}</h1>
      </div>

      {/* Active event banner */}
      {activeEvent && (
        <Link
          href={`/events/${activeEvent.id}`}
          className="flex items-center gap-3 border border-violet-700 bg-violet-700 text-white p-4 mb-5 cursor-pointer hover:bg-violet-800 transition-colors"
        >
          <Zap size={16} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-violet-200 uppercase tracking-widest font-bold mb-0.5">{t.events.activeEvent}</p>
            <p className="font-bold text-sm truncate">{activeEvent.name}</p>
            {activeEvent.city && <p className="text-violet-200 text-xs font-medium">{activeEvent.city}</p>}
          </div>
          <ChevronRight size={14} className="flex-shrink-0" />
        </Link>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => { setTab(tab === "create" ? null : "create"); setError(""); }}
          className={`p-4 flex flex-col items-start gap-2 border transition-colors cursor-pointer ${
            tab === "create" ? "btn-gold border-[#14110F]" : "border-[#14110F] hover:bg-[#14110F] hover:text-[#FAF8F3]"
          }`}
        >
          <Plus size={20} className={tab === "create" ? "text-[#FAF8F3]" : "text-amber-700"} />
          <span className="font-bold text-sm">{t.events.create}</span>
          <span className={`text-xs font-medium ${tab === "create" ? "text-[#FAF8F3]/70" : "text-[#4A3F2C]"}`}>{t.events.createHint}</span>
        </button>
        <button
          onClick={() => { setTab(tab === "join" ? null : "join"); setError(""); }}
          className={`p-4 flex flex-col items-start gap-2 border transition-colors cursor-pointer ${
            tab === "join" ? "bg-violet-700 border-violet-700 text-white" : "border-violet-700 hover:bg-violet-700 hover:text-white"
          }`}
        >
          <Hash size={20} className={tab === "join" ? "text-white" : "text-violet-700"} />
          <span className="font-bold text-sm">{t.events.join}</span>
          <span className={`text-xs font-medium ${tab === "join" ? "text-violet-200" : "text-[#4A3F2C]"}`}>{t.events.joinHint}</span>
        </button>
      </div>

      {/* Create form */}
      {tab === "create" && (
        <form onSubmit={handleCreate} className="border border-[#14110F] p-5 mb-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.events.namePlaceholder}
            required
            minLength={2}
            className="w-full h-12 px-4 bg-transparent border border-[#14110F] text-[#14110F] font-medium text-sm mb-3 outline-none placeholder:text-[#6B5D42]"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t.events.cityPlaceholder}
            className="w-full h-12 px-4 bg-transparent border border-[#14110F] text-[#14110F] font-medium text-sm mb-4 outline-none placeholder:text-[#6B5D42]"
          />
          {error && <p className="text-rose-700 text-xs font-semibold mb-3">{error}</p>}
          <button type="submit" disabled={creating || !name.trim()}
            className="w-full h-12 btn-gold font-bold text-sm disabled:opacity-50 cursor-pointer">
            {creating ? t.events.creating : t.events.createBtn}
          </button>
        </form>
      )}

      {/* Join form */}
      {tab === "join" && (
        <form onSubmit={handleJoin} className="border border-violet-700 p-5 mb-5">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t.events.codePlaceholder}
            maxLength={6}
            required
            className="w-full h-12 px-4 bg-transparent border border-[#14110F] text-[#14110F] font-bold text-lg tracking-[0.4em] uppercase mb-4 outline-none text-center placeholder:text-[#6B5D42]"
          />
          {error && <p className="text-rose-700 text-xs font-semibold mb-3">{error}</p>}
          <button type="submit" disabled={joining || code.length !== 6}
            className="w-full h-12 bg-violet-700 hover:bg-violet-800 text-white font-bold text-sm disabled:opacity-50 cursor-pointer transition-colors">
            {joining ? t.events.joining : t.events.joinBtn}
          </button>
        </form>
      )}

      {/* Events list */}
      {!loading && memberships.length === 0 && (
        <div className="text-center py-14 border-t border-b border-[#14110F]">
          <CalendarDays size={40} className="text-[#E3DCCB] mx-auto mb-3" />
          <p className="display italic text-xl mb-1">{t.events.noEvents}</p>
          <p className="text-[#4A3F2C] text-xs font-medium">{t.events.noEventsHint}</p>
        </div>
      )}

      {memberships.length > 0 && (
        <div>
          <p className="eyebrow mb-3">Your Events</p>
          <div className="flex flex-col divide-y divide-[#E3DCCB] border-t border-b border-[#14110F]">
            {memberships.map(({ is_active, events: ev }) => (
              <div key={ev.id} className="flex items-center gap-3 py-3">
                <Link href={`/events/${ev.id}`} className="flex-1 flex items-center gap-3 min-w-0">
                  <CalendarDays size={16} className={is_active ? "text-violet-700 flex-shrink-0" : "text-[#4A3F2C] flex-shrink-0"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ev.name}</p>
                    <p className="text-[#4A3F2C] text-xs font-medium">{ev.join_code}{ev.city ? ` · ${ev.city}` : ""}</p>
                  </div>
                </Link>
                {is_active
                  ? <span className="text-[10px] border border-violet-700 text-violet-700 font-bold px-2 py-0.5 flex-shrink-0">{t.events.active}</span>
                  : <button onClick={() => setActive(ev.id, memberships)}
                      className="text-[10px] border border-[#E3DCCB] text-[#4A3F2C] font-bold px-2 py-0.5 flex-shrink-0 hover:border-violet-700 hover:text-violet-700 transition-colors cursor-pointer">
                      {t.events.setActive}
                    </button>
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
