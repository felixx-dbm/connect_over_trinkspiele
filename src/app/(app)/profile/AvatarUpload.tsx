"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  initials: string;
  avatarUrl: string | null;
};

export default function AvatarUpload({ userId, initials, avatarUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Max 2 MB"); return; }

    setError(null);
    setUploading(true);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) { setError("Upload failed"); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", userId);

    setPreview(`${publicUrl}?t=${Date.now()}`);
    setUploading(false);
    // Reset so the same file can be re-selected if needed
    e.target.value = "";
  };

  return (
    <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-full ring-gradient rounded-2xl p-0.5 shadow-lg shadow-amber-200/50 cursor-pointer group"
      >
        <div className="w-full h-full rounded-[14px] overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-display text-white text-2xl relative">
          {preview && (
            <Image src={preview} alt="Avatar" fill className="object-cover" unoptimized />
          )}
          {!preview && <span>{initials}</span>}

          <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
            uploading ? "bg-black/40" : "bg-black/0 group-hover:bg-black/35"
          }`}>
            {uploading
              ? <Loader2 size={18} className="text-white animate-spin" />
              : <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            }
          </div>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />

      {error && (
        <p className="absolute top-full left-0 mt-1 text-rose-500 text-[10px] font-bold whitespace-nowrap">{error}</p>
      )}
    </div>
  );
}
