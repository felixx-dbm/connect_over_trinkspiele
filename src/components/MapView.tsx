"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Swords, Users, AlertCircle } from "lucide-react";
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
};

type NearbyQueue = {
  id: string;
  game_type_name: string;
  username: string;
  distance_m: number;
  lat: number;
  lng: number;
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

export default function MapView({ filter }: { filter: string }) {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [matches, setMatches] = useState<NearbyMatch[]>([]);
  const [queue, setQueue] = useState<NearbyQueue[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/map/challenges?lat=${location.lat}&lng=${location.lng}&radius=10`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches ?? []);
        setQueue(data.queue ?? []);
      })
      .catch((e) => { if (e.name !== "AbortError") console.error("[map]", e); });

    return () => controller.abort();
  }, [location]);

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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-zinc-900 px-6 text-center">
        <p className="text-zinc-400 text-sm">Location access denied. Enable GPS to see nearby battles.</p>
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
          <Marker key={m.id} position={[m.lat, m.lng]} icon={challengeIcon}>
            <Popup>
              <div className="bg-zinc-900 rounded-xl p-3 min-w-[180px]">
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
              </div>
            </Popup>
          </Marker>
        ))}

        {queue.map((q) => (
          <Marker key={q.id} position={[q.lat, q.lng]} icon={userIcon}>
            <Popup>
              <div className="bg-zinc-900 rounded-xl p-3 min-w-[160px]">
                <p className="text-zinc-200 font-bold text-sm mb-1">{q.username}</p>
                <p className="text-zinc-400 text-xs capitalize mb-1">{q.game_type_name.replace(/_/g, " ")}</p>
                <p className="text-zinc-600 text-xs">{Math.round(q.distance_m)}m away · In queue</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {filteredMatches.length > 0 && (
        <div className="absolute top-3 right-3 z-[1000] bg-zinc-900/90 backdrop-blur border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
          <Users size={12} className="text-amber-400" />
          <span className="text-amber-400 text-xs font-bold">{filteredMatches.length} nearby</span>
        </div>
      )}
    </div>
  );
}
