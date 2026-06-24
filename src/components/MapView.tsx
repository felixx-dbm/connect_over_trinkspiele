"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Swords, Users, AlertCircle, RefreshCw, ChevronUp, ChevronDown, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LanguageProvider";

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

const crewChallengeIcon = new L.DivIcon({
  html: `<div style="width:36px;height:36px;background:#8b5cf6;border-radius:8px;border:2px solid #a78bfa;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(139,92,246,0.5)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
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

type NearbyCrewMatch = {
  id: string;
  game_type_name: string;
  challenger_crew_name: string;
  challenger_crew_id: string;
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
  const t = useT();
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [matches, setMatches] = useState<NearbyMatch[]>([]);
  const [queue, setQueue] = useState<NearbyQueue[]>([]);
  const [crewMatches, setCrewMatches] = useState<NearbyCrewMatch[]>([]);
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
        setCrewMatches(data.crew_matches ?? []);
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

  const externalMatches = filteredMatches.filter((m) => !m.is_own);
  const ownMatches = filteredMatches.filter((m) => m.is_own);
  const externalQueue = queue.filter((q) => !q.is_own);
  const externalCrewMatches = crewMatches.filter((cm) => !cm.is_own);
  const hasNearby = filteredMatches.length > 0 || externalQueue.length > 0 || externalCrewMatches.length > 0;

  if (!location && !locationError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-amber-50">
        <Loader2 size={28} className="text-amber-500 animate-spin" />
        <p className="text-stone-500 text-sm font-semibold">{t.map.gettingLocation}</p>
      </div>
    );
  }

  if (locationError && !location) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-amber-50 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
          <AlertCircle size={24} className="text-rose-400" />
        </div>
        <div>
          <p className="text-stone-700 font-bold text-sm mb-1">{t.map.locationRequired}</p>
          <p className="text-stone-400 text-sm font-semibold">{t.map.locationHint}</p>
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
              <div style={{background:"#fff",borderRadius:"12px",padding:"12px",minWidth:"180px",border:"1px solid #fde68a",boxShadow:"0 4px 20px rgba(245,158,11,0.15)"}}>
                {m.is_own ? (
                  <>
                    <p style={{color:"#7c3aed",fontWeight:800,fontSize:"13px",marginBottom:"4px"}}>Your Challenge</p>
                    <p style={{color:"#78716c",fontSize:"11px",textTransform:"capitalize",marginBottom:"2px"}}>{m.game_type_name.replace(/_/g, " ")}</p>
                    <p style={{color:"#a8a29e",fontSize:"11px",textTransform:"capitalize",marginBottom:"12px"}}>{m.mode} · Waiting</p>
                    <button
                      onClick={() => router.push(`/matches/${m.id}`)}
                      style={{width:"100%",height:"34px",background:"linear-gradient(135deg,#a78bfa,#8b5cf6)",border:"none",color:"#fff",fontSize:"11px",fontWeight:700,borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}}
                    >
                      View Lobby
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{color:"#d97706",fontWeight:800,fontSize:"13px",marginBottom:"4px"}}>{m.challenger_username}</p>
                    <p style={{color:"#78716c",fontSize:"11px",textTransform:"capitalize",marginBottom:"2px"}}>{m.game_type_name.replace(/_/g, " ")}</p>
                    <p style={{color:"#a8a29e",fontSize:"11px",marginBottom:"12px"}}>{m.mode} · {Math.round(m.distance_m)}m away</p>
                    {acceptError && accepting === null && (
                      <p style={{color:"#e11d48",fontSize:"10px",marginBottom:"6px",display:"flex",alignItems:"center",gap:"4px"}}>
                        <AlertCircle size={10} />{acceptError}
                      </p>
                    )}
                    <button
                      onClick={() => accept(m.id)}
                      disabled={accepting !== null}
                      style={{width:"100%",height:"34px",background:"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",color:"#fff",fontSize:"11px",fontWeight:700,borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"4px",opacity:accepting !== null ? 0.6 : 1}}
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

        {crewMatches.map((cm) => (
          <Marker key={`crew-${cm.id}`} position={[cm.lat, cm.lng]} icon={crewChallengeIcon}>
            <Popup>
              <div style={{background:"#fff",borderRadius:"12px",padding:"12px",minWidth:"180px",border:"1px solid #ddd6fe",boxShadow:"0 4px 20px rgba(139,92,246,0.15)"}}>
                <p style={{color:"#7c3aed",fontWeight:800,fontSize:"13px",marginBottom:"4px"}}>{cm.challenger_crew_name}</p>
                <p style={{color:"#78716c",fontSize:"11px",textTransform:"capitalize",marginBottom:"2px"}}>{cm.game_type_name.replace(/_/g," ")}</p>
                <p style={{color:"#a8a29e",fontSize:"11px",marginBottom:"12px"}}>{Math.round(cm.distance_m)}m away · Crew Battle</p>
                <button
                  onClick={() => router.push(`/crew-matches/${cm.id}`)}
                  style={{width:"100%",height:"34px",background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",border:"none",color:"#fff",fontSize:"11px",fontWeight:700,borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}}
                >
                  View Battle
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {queue.map((q) => (
          <Marker key={q.id} position={[q.lat, q.lng]} icon={userIcon} opacity={q.is_own ? 0.45 : 1}>
            <Popup>
              <div style={{background:"#fff",borderRadius:"12px",padding:"12px",minWidth:"160px",border:"1px solid #e7e5e4"}}>
                {q.is_own ? (
                  <>
                    <p style={{color:"#78716c",fontWeight:700,fontSize:"12px",marginBottom:"4px"}}>You (searching)</p>
                    <p style={{color:"#a8a29e",fontSize:"11px",textTransform:"capitalize",marginBottom:"2px"}}>{q.game_type_name.replace(/_/g, " ")}</p>
                    <p style={{color:"#d6d3d1",fontSize:"11px"}}>Looking for a match nearby</p>
                  </>
                ) : (
                  <>
                    <p style={{color:"#1c1917",fontWeight:700,fontSize:"12px",marginBottom:"4px"}}>{q.username}</p>
                    <p style={{color:"#78716c",fontSize:"11px",textTransform:"capitalize",marginBottom:"2px"}}>{q.game_type_name.replace(/_/g, " ")}</p>
                    <p style={{color:"#a8a29e",fontSize:"11px"}}>{Math.round(q.distance_m)}m away · In queue</p>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Nearby count badge */}
      {externalMatches.length > 0 && (
        <div className="absolute top-3 right-3 z-[1000] bg-white/92 backdrop-blur border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm shadow-amber-100/50">
          <Users size={12} className="text-amber-500" />
          <span className="text-amber-600 text-xs font-bold">{externalMatches.length} {t.map.nearby}</span>
        </div>
      )}

      {/* Empty state overlay */}
      {!hasNearby && lastRefresh && (
        <div className="absolute inset-0 z-[999] pointer-events-none flex items-end justify-center pb-32">
          <div className="pointer-events-auto bg-white/95 backdrop-blur border border-amber-100 rounded-2xl px-5 py-4 mx-4 text-center max-w-xs shadow-lg shadow-amber-100/40">
            <p className="text-stone-700 font-bold text-sm mb-1">{t.map.noBattles}</p>
            <p className="text-stone-400 text-xs font-semibold mb-3">{t.map.noBattlesHint}</p>
            <button
              onClick={() => location && fetchChallenges(location)}
              className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 mx-auto cursor-pointer transition-colors font-bold"
            >
              <RefreshCw size={11} />
              {t.matches.refresh}
            </button>
          </div>
        </div>
      )}

      {/* Last refreshed indicator */}
      {lastRefresh && (
        <div className="absolute bottom-24 left-3 z-[1000] bg-white/80 backdrop-blur rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 border border-amber-100 shadow-sm">
          <RefreshCw size={10} className="text-stone-400" />
          <span className="text-stone-400 text-[10px] font-semibold">
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
          className="w-full bg-white/95 backdrop-blur border-t border-amber-100 px-4 py-3 flex items-center justify-between cursor-pointer shadow-md shadow-amber-100/30"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="flex items-center gap-2">
            <Swords size={14} className="text-amber-500" />
            <span className="text-stone-800 text-sm font-bold">
              {externalMatches.length === 0
                ? t.map.noBattles
                : `${externalMatches.length} ${externalMatches.length !== 1 ? t.map.battlePlural : t.map.battleSingular} ${t.map.nearby}`}
            </span>
            {ownMatches.length > 0 && (
              <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full font-bold">
                {ownMatches.length} {t.map.yours}
              </span>
            )}
          </div>
          {listOpen ? <ChevronDown size={16} className="text-stone-400" /> : <ChevronUp size={16} className="text-stone-400" />}
        </button>

        {/* Sheet content */}
        {listOpen && (
          <div className="bg-white border-t border-amber-50 max-h-[55vh] overflow-y-auto">
            {/* Own challenges */}
            {ownMatches.length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] text-violet-500 uppercase tracking-widest mb-2 font-bold">{t.map.yourChallenges}</p>
                <div className="flex flex-col gap-2">
                  {ownMatches.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => router.push(`/matches/${m.id}`)}
                      className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl p-3 text-left cursor-pointer hover:border-violet-400 transition-colors w-full"
                    >
                      <span className="text-xl flex-shrink-0">{GAME_ICONS[m.game_type_name] ?? "🎮"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-violet-700 text-sm font-bold capitalize">
                          {m.game_type_name.replace(/_/g, " ")}
                        </p>
                        <p className="text-stone-400 text-xs font-semibold flex items-center gap-1 mt-0.5">
                          <Navigation size={9} />
                          {t.map.waitingOpponent}
                        </p>
                      </div>
                      <span className="text-xs text-violet-500 font-bold flex-shrink-0">View →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby battles */}
            {externalMatches.length > 0 && (
              <div className="px-4 pt-3 pb-2">
                <p className="text-[10px] text-amber-500 uppercase tracking-widest mb-2 font-bold">{t.map.nearbyBattles}</p>
                <div className="flex flex-col gap-2">
                  {externalMatches.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3"
                    >
                      <span className="text-xl flex-shrink-0">{GAME_ICONS[m.game_type_name] ?? "🎮"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-stone-800 text-sm font-bold">{m.challenger_username}</p>
                        <p className="text-stone-400 text-xs font-semibold capitalize flex items-center gap-1 mt-0.5">
                          <MapPin size={9} />
                          {m.game_type_name.replace(/_/g, " ")} · {Math.round(m.distance_m)}m
                        </p>
                      </div>
                      <button
                        onClick={() => accept(m.id)}
                        disabled={accepting !== null}
                        className="flex-shrink-0 h-8 px-3 bg-gradient-to-r from-amber-400 to-orange-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-amber-200/60"
                      >
                        {accepting === m.id ? <Loader2 size={11} className="animate-spin" /> : <Swords size={11} />}
                        {t.map.accept}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby crew battles */}
            {externalCrewMatches.length > 0 && (
              <div className="px-4 pt-3 pb-2">
                <p className="text-[10px] text-violet-500 uppercase tracking-widest mb-2 font-bold">Crew Battles</p>
                <div className="flex flex-col gap-2">
                  {externalCrewMatches.map((cm) => (
                    <button
                      key={cm.id}
                      onClick={() => router.push(`/crew-matches/${cm.id}`)}
                      className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl p-3 text-left cursor-pointer hover:border-violet-400 transition-colors w-full"
                    >
                      <span className="text-xl flex-shrink-0">👥</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-violet-700 text-sm font-bold">{cm.challenger_crew_name}</p>
                        <p className="text-stone-400 text-xs font-semibold capitalize flex items-center gap-1 mt-0.5">
                          <MapPin size={9} />
                          {cm.game_type_name.replace(/_/g, " ")} · {Math.round(cm.distance_m)}m
                        </p>
                      </div>
                      <span className="text-xs text-violet-500 font-bold flex-shrink-0">View →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredMatches.length === 0 && externalCrewMatches.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-stone-400 text-sm font-semibold">{t.map.noBattlesFilter}</p>
              </div>
            )}

            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
