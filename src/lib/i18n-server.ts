import { cookies } from "next/headers";
import { getTranslations, DEFAULT_LOCALE, type Locale } from "./i18n";

export async function getT() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("lang")?.value ?? DEFAULT_LOCALE) as Locale;
  return getTranslations(locale);
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get("lang")?.value ?? DEFAULT_LOCALE) as Locale;
}
