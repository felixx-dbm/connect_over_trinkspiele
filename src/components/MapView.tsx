"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Swords, Users, AlertCircle, RefreshCw, ChevronUp, ChevronDown, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

const challengeIcon = new L.DivIcon({
  html: `<div style="width:36px;height:36px;background:#f59e0b;border-radius:50%;border:2px solid #fbbf24;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(245,158,11,0.5)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#09090b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" x2="19" y1="6" y2="12"></line><line x1="6" x2="13" y1="13" y2="19"></line><line x1="16" x2="20" y1="17" y2="21"></line><line x1="4" x2="8" y1="3" y2="7"></line>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "",
});

const ownChallengeIcon = new L.DivIcon({
  html: `<div style="width:36px;height:36px;background:#6366f1;border-radius:50%;border:2px solid #818cf8;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(99,102,241,0.5)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" x2="19" y1="6" y2="12"></line><line x1="6" x2="13" y1="13" y2="19"></line><line x1="16" x2="20" y1="17" y2="21"></line><line x1="4" x2="8" y1="3" y2="7"></line>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "",
});

const userIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;border:3px solid #93c5fd;box-shadow:0 0 0 8px rgba(59,130,246,0.15)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: "",
});

type NearbyMatch = {
  id: string;
  game_type_name: string;
  mode: string;
  challenger_username: string;
  distance_m: number;
  lat: number;
  lng: number;
  is_own: boolean;
};

type NearbyQueue = {
  id: string;
  game_type_name: string;
  username: string;
  distance_m: number;
  lat: number;
  lng: number;
  is_own: boolean;
};

function RecenterOnce({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const didCenter = useRef(false);
  useEffect(() => {
    if (didCenter.current) return;
    didCenter.current = true;
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

const REFRESH_INTERVAL_MS = 30_000;

const GAME_ICONS: Record<string, string> = {
  beer_pong: "🏓",
  flunky_ball: "⚽",
  freestyle: "🎲",
};

export default function MapView({ filter }: { filter: string }) {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [matches, setMatches] = useState<NearbyMatch[]>([]);
  const [queue, setQueue] = useState<NearbyQueue[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchChallenges = useCallback((loc: { lat: number; lng: number }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/map/challenges?lat=${loc.lat}&lng=${loc.lng}&radius=10`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches ?? []);
        setQueue(data.queue ?? []);
        setLastRefresh(new Date());
      })
      .catch((e) => { if (e.name !== "AbortError") console.error("[map]", e); });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError(true),
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!location) return;
    fetchChallenges(location);
  }, [location, fetchChallenges]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!location) return;
    const t = setInterval(() => fetchChallenges(location), REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [location, fetchChallenges]);

  const accept = async (matchId: string) => {
    setAccepting(matchId);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/accept`, { method: "POST" });
      if (res.ok) {
        router.push(`/matches/${matchId}`);
      } else {
        const data = await res.json() as { error?: string };
        setAcceptError(data.error ?? "Failed to accept match");
      }
    } catch {
      setAcceptError("Network error — try again");
    } finally {
      setAccepting(null);
    }
  };

  const filteredMatches = filter === "All"
    ? matches
    : matches.filter((m) => m.game_type_name.replace(/_/g, " ").toLowerCase() === filter.toLowerCase());

  const externalQueue = queue.filter((q) => !q.is_own);
  const hasNearby = filteredMatches.length > 0 || externalQueue.length > 0;

  if (!location && !locationError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-zinc-900">
        <Loader2 size={28} className="text-amber-400 animate-spin" />
        <p className="text-zinc-400 text-sm">Getting your location…</p>
      </div>
    );
  }

  if (locationError && !location) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-zinc-900 px-6 text-center">
        <AlertCircle size={32} className="text-zinc-600" />
        <div>
          <p className="text-zinc-300 font-medium text-sm mb-1">Location access required</p>
          <p className="text-zinc-500 text-sm">Enable GPS in your browser settings to see nearby battles.</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [location!.lat, location!.lng];

  return (
    <div className="flex-1 relative" style={{ minHeight: 0 }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100%", width: "100%", background: "#18181b" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnce lat={center[0]} lng={center[1]} />

        <Marker position={center} icon={userIcon} />
        <Circle
          center={center}
          radius={200}
          pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08, weight: 1 }}
        />

        {filteredMatches.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={m.is_own ? ownChallengeIcon : challengeIcon}>
            <Popup>
              <div className="bg-zinc-900 rounded-xl p-3 min-w-[180px]">
                {m.is_own ? (
                  <>
                    <p className="text-indigo-400 font-bold text-sm mb-1">Your Challenge</p>
                    <p className="text-zinc-400 text-xs capitalize mb-1">{m.game_type_name.replace(/_/g, " ")}</p>
                    <p className="text-zinc-600 text-xs capitalize mb-3">{m.mode} · Waiting for opponent</p>
                    <button
                      onClick={() => router.push(`/matches/${m.id}`)}
                      className="w-full h-9 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      View Lobby
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-amber-400 font-bold text-sm mb-1">{m.challenger_username}</p>
                    <p className="text-zinc-400 text-xs capitalize mb-1">{m.game_type_name.replace(/_/g, " ")}</p>
                    <p className="text-zinc-600 text-xs capitalize mb-3">{m.mode} · {Math.round(m.distance_m)}m away</p>
                    {acceptError && accepting === null && (
                      <p className="text-red-400 text-xs mb-2 flex items-center gap-1">
                        <AlertCircle size={10} />{acceptError}
                      </p>
                    )}
                    <button
                      onClick={() => accept(m.id)}
                      disabled={accepting !== null}
                      className="w-full h-9 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {accepting === m.id ? <Loader2 size={12} className="animate-spin" /> : <Swords size={12} />}
                      Accept Challenge
                    </button>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {queue.map((q) => (
          <Marker key={q.id} position={[q.lat, q.lng]} icon={userIcon} opacity={q.is_own ? 0.45 : 1}>
            <Popup>
              <div className="bg-zinc-900 rounded-xl p-3 min-w-[160px]">
                {q.is_own ? (
                  <>
                    <p className="text-zinc-400 font-bold text-sm mb-1">You (searching)</p>
                    <p className="text-zinc-500 text-xs capitalize mb-1">{q.game_type_name.replace(/_/g, " ")}</p>
                    <p className="text-zinc-600 text-xs">Looking for a match nearby</p>
                  </>
                ) : (
                  <>
                    <p className="text-zinc-200 font-bold text-sm mb-1">{q.username}</p>
                    <p className="text-zinc-400 text-xs capitalize mb-1">{q.game_type_name.replace(/_/g, " ")}</p>
                    <p className="text-zinc-600 text-xs">{Math.round(q.distance_m)}m away · In queue</p>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Nearby count badge */}
      {hasNearby && (
        <div className="absolute top-3 right-3 z-[1000] bg-zinc-900/90 backdrop-blur border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
          <Users size={12} className="text-amber-400" />
          <span className="text-amber-400 text-xs font-bold">{filteredMatches.length} nearby</span>
        </div>
      )}

      {/* Empty state overlay */}
      {!hasNearby && lastRefresh && (
        <div className="absolute inset-0 z-[999] pointer-events-none flex items-end justify-center pb-32">
          <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-2xl px-5 py-4 mx-4 text-center max-w-xs">
            <p className="text-zinc-300 font-medium text-sm mb-1">No battles nearby</p>
            <p className="text-zinc-500 text-xs mb-3">Post an Open Challenge and let others find you</p>
            <button
              onClick={() => location && fetchChallenges(location)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 mx-auto cursor-pointer transition-colors"
            >
              <RefreshCw size={11} />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Last refreshed indicator */}
      {lastRefresh && (
        <div className="absolute bottom-24 left-3 z-[1000] bg-zinc-900/80 backdrop-blur rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <RefreshCw size={10} className="text-zinc-600" />
          <span className="text-zinc-600 text-[10px]">
            {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      {/* Match list bottom sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 z-[1001] transition-transform duration-300 ease-in-out"
        style={{ transform: listOpen ? "translateY(0)" : "translateY(calc(100% - 56px))" }}
      >
        {/* Sheet handle / toggle bar */}
        <button
          onClick={() => setListOpen((v) => !v)}
          className="w-full bg-zinc-900/95 backdrop-blur border-t border-zinc-800 px-4 py-3 flex items-center justify-between cursor-pointer"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="flex items-center gap-2">
            <Swords size={14} className="text-amber-400" />
            <span className="text-zinc-200 text-sm font-semibold">
              {filteredMatches.length + externalQueue.length === 0
                ? "No battles nearby"
                : `${filteredMatches.length + externalQueue.length} battle${filteredMatches.length + externalQueue.length !== 1 ? "s" : ""} nearby`}
            </span>
            {filteredMatches.filter((m) => m.is_own).length > 0 && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                {filteredMatches.filter((m) => m.is_own).length} yours
              </span>
            )}
          </div>
          {listOpen ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronUp size={16} className="text-zinc-500" />}
        </button>

        {/* Sheet content */}
        {listOpen && (
          <div className="bg-zinc-950 border-t border-zinc-800 max-h-[55vh] overflow-y-auto">
            {/* Own challenges */}
            {filteredMatches.filter((m) => m.is_own).length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-2">Your Challenges</p>
                <div className="flex flex-col gap-2">
                  {filteredMatches.filter((m) => m.is_own).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => router.push(`/matches/${m.id}`)}
                      className="flex items-center gap-3 bg-zinc-900 border border-indigo-500/20 rounded-xl p-3 text-left cursor-pointer hover:border-indigo-500/40 transition-colors w-full"
                    >
                      <span className="text-xl flex-shrink-0">{GAME_ICONS[m.game_type_name] ?? "🎮"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-indigo-300 text-sm font-semibold capitalize">
                          {m.game_type_name.replace(/_/g, " ")}
                        </p>
                        <p className="text-zinc-600 text-xs flex items-center gap-1 mt-0.5">
                          <Navigation size={9} />
                          Waiting for opponent
                        </p>
                      </div>
                      <span className="text-xs text-indigo-400 font-medium flex-shrink-0">View →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby battles */}
            {filteredMatches.filter((m) => !m.is_own).length > 0 && (
              <div className="px-4 pt-3 pb-2">
                <p className="text-[10px] text-amber-400 uppercase tracking-widest mb-2">Nearby Battles</p>
                <div className="flex flex-col gap-2">
                  {filteredMatches.filter((m) => !m.is_own).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3"
                    >
                      <span className="text-xl flex-shrink-0">{GAME_ICONS[m.game_type_name] ?? "🎮"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-200 text-sm font-semibold">{m.challenger_username}</p>
                        <p className="text-zinc-500 text-xs capitalize flex items-center gap-1 mt-0.5">
                          <MapPin size={9} />
                          {m.game_type_name.replace(/_/g, " ")} · {Math.round(m.distance_m)}m
                        </p>
                      </div>
                      <button
                        onClick={() => accept(m.id)}
                        disabled={accepting !== null}
                        className="flex-shrink-0 h-8 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        {accepting === m.id ? <Loader2 size={11} className="animate-spin" /> : <Swords size={11} />}
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredMatches.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-zinc-600 text-sm">No battles match your filter</p>
              </div>
            )}

            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
