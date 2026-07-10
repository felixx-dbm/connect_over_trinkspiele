"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";
import { useT } from "@/components/LanguageProvider";

type Props = { username: string; city: string; fullWidth?: boolean };

export default function EditAccountButton({ username, city, fullWidth }: Props) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center gap-1.5 text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer ${
          fullWidth
            ? "w-full h-10 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl"
            : "text-xs"
        }`}
      >
        <Edit3 size={fullWidth ? 14 : 12} />
        {fullWidth ? t.settings.editProfile : t.common.edit}
      </button>
      {open && (
        <EditProfileModal
          initialUsername={username}
          initialCity={city}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
