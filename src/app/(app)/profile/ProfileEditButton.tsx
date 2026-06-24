"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";

type Props = { username: string; city: string };

export default function ProfileEditButton({ username, city }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-white border border-amber-200 shadow-sm flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all"
        aria-label="Edit profile"
      >
        <Edit3 size={11} className="text-amber-500" />
      </button>
      {open && <EditProfileModal initialUsername={username} initialCity={city} onClose={() => setOpen(false)} />}
    </>
  );
}
