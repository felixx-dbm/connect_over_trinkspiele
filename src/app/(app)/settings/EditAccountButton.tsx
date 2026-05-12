"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";

export default function EditAccountButton({ username, city }: { username: string; city: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
      >
        <Edit3 size={12} />
        Edit
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
