"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import DeleteAccountModal from "./DeleteAccountModal";

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-rose-500 font-bold border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <Trash2 size={11} />
        Delete
      </button>
      {open && <DeleteAccountModal onClose={() => setOpen(false)} />}
    </>
  );
}
