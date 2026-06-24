"use client";

import { createContext, useContext } from "react";
import { getTranslations, type Locale, type Translations } from "@/lib/i18n";

const LanguageContext = createContext<Translations>(getTranslations("en"));

export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <LanguageContext.Provider value={getTranslations(locale)}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
