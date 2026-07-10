"use client";

import { useState } from "react";
import { Trophy, Swords, MapPin } from "lucide-react";

type Key = "show_on_leaderboard" | "allow_direct_challenges" | "share_location";

type Props = {
  showOnLeaderboard: boolean;
  allowDirectChallenges: boolean;
  shareLocation: boolean;
  labels: {
    leaderboard: string;    leaderboardHint: string;
    challenges: string;     challengesHint: string;
    location: string;       locationHint: string;
  };
};

export default function PrivacySettings({ showOnLeaderboard, allowDirectChallenges, shareLocation, labels }: Props) {
  const [values, setValues] = useState<Record<Key, boolean>>({
    show_on_leaderboard:    showOnLeaderboard,
    allow_direct_challenges: allowDirectChallenges,
    share_location:         shareLocation,
  });
  const [saving, setSaving] = useState<Key | null>(null);

  const toggle = async (key: Key) => {
    const next = !values[key];
    setValues((v) => ({ ...v, [key]: next }));
    setSaving(key);
    await fetch("/api/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: next }),
    });
    setSaving(null);
  };

  const rows: { key: Key; label: string; hint: string; Icon: typeof Trophy }[] = [
    { key: "show_on_leaderboard",    label: labels.leaderboard, hint: labels.leaderboardHint, Icon: Trophy  },
    { key: "allow_direct_challenges", label: labels.challenges,  hint: labels.challengesHint,  Icon: Swords  },
    { key: "share_location",         label: labels.location,    hint: labels.locationHint,    Icon: MapPin  },
  ];

  return (
    <div className="flex flex-col">
      {rows.map(({ key, label, hint, Icon }, i) => (
        <div key={key}>
          {i !== 0 && <div className="h-px bg-[#E3DCCB] mx-1" />}
          <div className="flex items-center gap-3 py-3.5">
            <Icon size={16} className="text-amber-700 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">{label}</p>
              <p className="text-[#4A3F2C] text-xs font-medium leading-snug">{hint}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={saving === key}
              role="switch"
              aria-checked={values[key]}
              aria-label={label}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border border-[#14110F] transition-colors duration-200 ease-in-out ${
                values[key] ? "bg-emerald-600" : "bg-transparent"
              } ${saving === key ? "opacity-70" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 mt-0.5 transform ${
                  values[key] ? "bg-white translate-x-[22px]" : "bg-[#14110F] translate-x-0.5"
                } transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
