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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-xl text-stone-900">
          {t.events.title} <span className="text-gradient">{t.events.titleAccent}</span>
        </h1>
      </div>

      {/* Active event banner */}
      {activeEvent && (
        <Link
          href={`/events/${activeEvent.id}`}
          className="relative flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5 overflow-hidden cursor-pointer hover:bg-violet-100 transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-violet-500 uppercase tracking-widest font-bold mb-0.5">{t.events.activeEvent}</p>
            <p className="text-stone-800 font-bold text-sm truncate">{activeEvent.name}</p>
            {activeEvent.city && <p className="text-stone-500 text-xs font-semibold">{activeEvent.city}</p>}
          </div>
          <ChevronRight size={14} className="text-violet-400 flex-shrink-0" />
        </Link>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => { setTab(tab === "create" ? null : "create"); setError(""); }}
          className={`rounded-2xl p-4 flex flex-col items-start gap-2 transition-all cursor-pointer ${
            tab === "create" ? "btn-gold" : "bg-white border border-amber-200 text-stone-700 hover:bg-amber-50 shadow-sm"
          }`}
        >
          <Plus size={20} className={tab === "create" ? "text-white" : "text-amber-500"} />
          <span className="font-bold text-sm">{t.events.create}</span>
          <span className={`text-xs font-semibold ${tab === "create" ? "text-amber-100" : "text-stone-400"}`}>{t.events.createHint}</span>
        </button>
        <button
          onClick={() => { setTab(tab === "join" ? null : "join"); setError(""); }}
          className={`rounded-2xl p-4 flex flex-col items-start gap-2 transition-all cursor-pointer ${
            tab === "join" ? "bg-violet-600 text-white" : "bg-white border border-violet-200 text-stone-700 hover:bg-violet-50 shadow-sm"
          }`}
        >
          <Hash size={20} className={tab === "join" ? "text-white" : "text-violet-500"} />
          <span className="font-bold text-sm">{t.events.join}</span>
          <span className={`text-xs font-semibold ${tab === "join" ? "text-violet-200" : "text-stone-400"}`}>{t.events.joinHint}</span>
        </button>
      </div>

      {/* Create form */}
      {tab === "create" && (
        <form onSubmit={handleCreate} className="bg-white border border-amber-200 rounded-2xl p-5 mb-5 shadow-sm">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.events.namePlaceholder}
            required
            minLength={2}
            className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold text-sm mb-3 outline-none focus:border-amber-400"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t.events.cityPlaceholder}
            className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold text-sm mb-4 outline-none focus:border-amber-400"
          />
          {error && <p className="text-rose-500 text-xs font-semibold mb-3">{error}</p>}
          <button type="submit" disabled={creating || !name.trim()}
            className="w-full h-12 btn-gold rounded-xl font-bold text-sm disabled:opacity-50 cursor-pointer">
            {creating ? t.events.creating : t.events.createBtn}
          </button>
        </form>
      )}

      {/* Join form */}
      {tab === "join" && (
        <form onSubmit={handleJoin} className="bg-white border border-violet-200 rounded-2xl p-5 mb-5 shadow-sm">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t.events.codePlaceholder}
            maxLength={6}
            required
            className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold text-lg tracking-[0.4em] uppercase mb-4 outline-none focus:border-violet-400 text-center"
          />
          {error && <p className="text-rose-500 text-xs font-semibold mb-3">{error}</p>}
          <button type="submit" disabled={joining || code.length !== 6}
            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 cursor-pointer transition-colors">
            {joining ? t.events.joining : t.events.joinBtn}
          </button>
        </form>
      )}

      {/* Events list */}
      {!loading && memberships.length === 0 && (
        <div className="text-center py-14">
          <CalendarDays size={48} className="text-stone-200 mx-auto mb-3" />
          <p className="text-stone-500 text-sm font-semibold mb-1">{t.events.noEvents}</p>
          <p className="text-stone-400 text-xs font-semibold">{t.events.noEventsHint}</p>
        </div>
      )}

      {memberships.length > 0 && (
        <div>
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">Your Events</p>
          <div className="flex flex-col gap-2">
            {memberships.map(({ is_active, events: ev }) => (
              <div key={ev.id} className={`flex items-center gap-3 bg-white border rounded-2xl p-3 shadow-sm ${is_active ? "border-violet-300 bg-violet-50" : "border-amber-100"}`}>
                <Link href={`/events/${ev.id}`} className="flex-1 flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${is_active ? "bg-violet-200" : "bg-stone-100"}`}>
                    <CalendarDays size={14} className={is_active ? "text-violet-600" : "text-stone-400"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 text-sm font-bold truncate">{ev.name}</p>
                    <p className="text-stone-400 text-xs font-semibold">{ev.join_code}{ev.city ? ` · ${ev.city}` : ""}</p>
                  </div>
                </Link>
                {is_active
                  ? <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-2 py-0.5 rounded-full flex-shrink-0">{t.events.active}</span>
                  : <button onClick={() => setActive(ev.id, memberships)}
                      className="text-[10px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5 rounded-full flex-shrink-0 hover:bg-violet-100 hover:text-violet-600 transition-colors cursor-pointer">
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
