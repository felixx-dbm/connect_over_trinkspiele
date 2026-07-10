"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle, Check } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { useT } from "@/components/LanguageProvider";

type Props = {
  initialUsername: string;
  initialCity: string;
  onClose: () => void;
};

export default function EditProfileModal({ initialUsername, initialCity, onClose }: Props) {
  const router = useRouter();
  const t = useT();
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
    router.refresh();
    closeTimerRef.current = setTimeout(onClose, 800);
  };

  return (
    <div
      className="fixed inset-0 bg-[#14110F]/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[#FAF8F3] border border-[#14110F] p-6 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="display text-xl">{t.editProfile.title}</h3>
            <p className="text-[#6B5D42] text-xs font-medium mt-0.5">{t.editProfile.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close edit profile dialog" className="w-8 h-8 border border-[#14110F] hover:bg-[#14110F] hover:text-[#FAF8F3] flex items-center justify-center cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="eyebrow block mb-1.5">{t.editProfile.username}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={2}
              maxLength={30}
              required
              className="w-full h-14 bg-transparent border border-[#14110F] px-4 placeholder:text-[#6B5D42] focus:outline-none text-sm font-medium"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">{t.editProfile.city}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t.editProfile.cityPlaceholder}
              maxLength={60}
              className="w-full h-14 bg-transparent border border-[#14110F] px-4 placeholder:text-[#6B5D42] focus:outline-none text-sm font-medium"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-700 text-sm mb-4 bg-rose-50 border border-rose-700 px-3 py-2 font-semibold">
            <AlertCircle size={14} className="flex-shrink-0" />{error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || saved}
          className={`w-full h-12 font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            saved
              ? "bg-emerald-600 text-white"
              : loading
              ? "border border-[#E3DCCB] text-[#6B5D42] cursor-not-allowed"
              : "btn-gold"
          }`}
        >
          {saved ? <><Check size={16} /> {t.common.saved}</> : loading ? t.common.saving : t.common.save}
        </button>
      </form>
    </div>
  );
}
