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
        className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FAF8F3] border border-[#14110F] flex items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors"
        aria-label="Edit profile"
      >
        <Edit3 size={11} className="text-amber-700" />
      </button>
      {open && <EditProfileModal initialUsername={username} initialCity={city} onClose={() => setOpen(false)} />}
    </>
  );
}
