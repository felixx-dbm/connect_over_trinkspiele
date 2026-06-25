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
          {i !== 0 && <div className="h-px bg-amber-50 mx-1" />}
          <div className="flex items-center gap-3 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Icon size={13} className="text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-stone-800 text-sm font-bold">{label}</p>
              <p className="text-stone-400 text-xs font-semibold leading-snug">{hint}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={saving === key}
              role="switch"
              aria-checked={values[key]}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                values[key] ? "bg-amber-500" : "bg-stone-200"
              } ${saving === key ? "opacity-70" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  values[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
