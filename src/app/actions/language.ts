"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/lib/i18n";

export async function setLanguage(locale: Locale) {
  (await cookies()).set("lang", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
