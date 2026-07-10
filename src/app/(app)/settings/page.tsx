import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, User, Mail, MapPin, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { getT, getLocale } from "@/lib/i18n-server";
import EditAccountButton from "./EditAccountButton";
import LanguageSwitcher from "./LanguageSwitcher";
import DeleteAccountButton from "./DeleteAccountButton";
import PrivacySettings from "./PrivacySettings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, t, locale] = await Promise.all([
    supabase
      .from("users")
      .select("username, city, show_on_leaderboard, allow_direct_challenges, share_location")
      .eq("id", user.id)
      .single(),
    getT(),
    getLocale(),
  ]);

  const p = profile as {
    username: string | null; city: string | null;
    show_on_leaderboard: boolean; allow_direct_challenges: boolean; share_location: boolean;
  } | null;

  const accountRows = [
    { Icon: User,   label: t.settings.username, value: p?.username ?? "—" },
    { Icon: MapPin, label: t.settings.city,      value: p?.city ?? null    },
    { Icon: Mail,   label: t.settings.email,     value: user.email ?? "—"  },
  ];

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile" aria-label="Back to profile" className="w-9 h-9 border border-[#14110F] flex items-center justify-center cursor-pointer">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="eyebrow mb-0.5">{t.settings.title}</p>
          <h1 className="display text-2xl">{t.settings.titleAccent}</h1>
        </div>
      </div>

      {/* Account info */}
      <div className="border border-[#14110F] p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="eyebrow">{t.settings.account}</p>
          <EditAccountButton username={p?.username ?? ""} city={p?.city ?? ""} />
        </div>
        <div className="flex flex-col divide-y divide-[#E3DCCB]">
          {accountRows.map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-3.5">
              <Icon size={14} className="text-amber-700 flex-shrink-0" />
              <span className="text-[#4A3F2C] text-sm font-medium flex-1">{label}</span>
              <span className={`text-sm font-bold truncate max-w-[160px] ${value ? "" : "text-[#6B5D42]"}`}>
                {value ?? t.settings.notSet}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-3 border-t border-[#E3DCCB]">
          <EditAccountButton username={p?.username ?? ""} city={p?.city ?? ""} fullWidth />
        </div>
      </div>

      {/* Language switcher */}
      <div className="border border-[#14110F] p-5 mb-4">
        <LanguageSwitcher currentLocale={locale} />
      </div>

      {/* Privacy settings */}
      <div className="border border-[#14110F] p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={13} className="text-amber-700" />
          <p className="eyebrow">{t.settings.privacy}</p>
        </div>
        <PrivacySettings
          showOnLeaderboard={p?.show_on_leaderboard ?? true}
          allowDirectChallenges={p?.allow_direct_challenges ?? true}
          shareLocation={p?.share_location ?? true}
          labels={{
            leaderboard:     t.settings.privacyLeaderboard,
            leaderboardHint: t.settings.privacyLeaderboardHint,
            challenges:      t.settings.privacyChallenges,
            challengesHint:  t.settings.privacyChallengesHint,
            location:        t.settings.privacyLocation,
            locationHint:    t.settings.privacyLocationHint,
          }}
        />
      </div>

      {/* Coming soon */}
      <div className="border border-[#14110F] p-5 mb-4">
        <p className="eyebrow mb-3">{t.settings.comingSoonTitle}</p>
        <p className="text-[#4A3F2C] text-sm font-medium mb-3 leading-relaxed">{t.settings.comingSoonText}</p>
        <div className="flex flex-wrap gap-2">
          {t.settings.comingSoonTags.map((label) => (
            <span key={label} className="text-xs border border-amber-700 text-amber-700 px-3 py-1.5 font-bold">
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-rose-700 p-5 mb-6">
        <p className="eyebrow mb-3 text-rose-700">{t.settings.dangerZone}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 size={16} className="text-rose-700" />
            <span className="text-[#4A3F2C] text-sm font-medium">{t.settings.deleteAccount}</span>
          </div>
          <DeleteAccountButton />
        </div>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full h-12 flex items-center justify-center text-rose-700 border border-rose-700 hover:bg-rose-50 text-sm font-bold transition-colors cursor-pointer"
        >
          {t.common.signOut}
        </button>
      </form>
    </div>
  );
}
