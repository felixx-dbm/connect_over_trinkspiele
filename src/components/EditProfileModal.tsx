"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertCircle, Check } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";

type Props = {
  initialUsername: string;
  initialCity: string;
  onClose: () => void;
};

export default function EditProfileModal({ initialUsername, initialCity, onClose }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [city, setCity] = useState(initialCity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await updateProfile(username, city);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSaved(true);
    closeTimerRef.current = setTimeout(onClose, 800);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg mx-auto bg-zinc-900 border border-zinc-800 rounded-t-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg text-zinc-100">Edit Profile</h3>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={2}
              maxLength={30}
              required
              className="w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Optional"
              maxLength={60}
              className="w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
            <AlertCircle size={14} />{error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || saved}
          className="w-full h-12 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {saved ? <><Check size={16} /> Saved!</> : loading ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
