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
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors"
        aria-label="Edit profile"
      >
        <Edit3 size={10} className="text-zinc-400" />
      </button>
      {open && <EditProfileModal initialUsername={username} initialCity={city} onClose={() => setOpen(false)} />}
    </>
  );
}
