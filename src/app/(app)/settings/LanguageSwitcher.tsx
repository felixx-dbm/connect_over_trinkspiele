"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LanguageProvider";
import { setLanguage } from "@/app/actions/language";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSwitch = (locale: Locale) => {
    startTransition(async () => {
      await setLanguage(locale);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-stone-800 text-sm font-bold">{t.settings.language}</p>
          <p className="text-stone-400 text-xs font-semibold">{t.settings.languageHint}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {(["en", "de"] as Locale[]).map((locale) => (
          <button
            key={locale}
            onClick={() => handleSwitch(locale)}
            disabled={pending || currentLocale === locale}
            className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              currentLocale === locale
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200/60 cursor-default"
                : "bg-amber-50 border border-amber-200 text-stone-600 hover:border-amber-400 hover:bg-amber-100/60"
            } ${pending ? "opacity-60" : ""}`}
          >
            <span>{locale === "en" ? "🇬🇧" : "🇩🇪"}</span>
            <span>{locale === "en" ? "English" : "Deutsch"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
