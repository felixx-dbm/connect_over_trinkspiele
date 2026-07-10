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
          <p className="text-sm font-bold">{t.settings.language}</p>
          <p className="text-[#4A3F2C] text-xs font-medium">{t.settings.languageHint}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {(["en", "de"] as Locale[]).map((locale) => (
          <button
            key={locale}
            onClick={() => handleSwitch(locale)}
            disabled={pending || currentLocale === locale}
            className={`flex-1 h-11 font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 border ${
              currentLocale === locale
                ? "bg-[#14110F] border-[#14110F] text-[#FAF8F3] cursor-default"
                : "border-[#E3DCCB] text-[#4A3F2C] hover:border-[#14110F]"
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
