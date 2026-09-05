"use server";

/**
 * Server actions for authentication — sign-up, login, logout, password reset.
 * All auth state changes use window.location.href redirects (not router.push)
 * so the browser picks up the new session cookie before re-rendering.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/validate";

/**
 * Calendar-accurate age. The old 365.25-day division drifted by up to a day
 * around leap years, which let some under-18s through the gate on their
 * birthday week. Migration 021 enforces this in the signup trigger too.
 */
function getAge(dob: string): number {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return -1;

  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export async function signUp(data: {
  username: string;
  email: string;
  password: string;
  dob: string;
}): Promise<{ error: string | null; needsConfirmation?: boolean }> {
  if (!data.dob || getAge(data.dob) < 18) {
    return { error: "You must be 18 or older to register." };
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) return { error: passwordError };

  const supabase = await createClient();
  let signUpData, error;
  try {
    ({ data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
          data: { username: data.username.trim(), birth_date: data.dob },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
        },
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[signUp] network error:", msg);
    return { error: "Could not reach the server — check your connection and try again." };
  }

  if (error) {
    // Backstop from the signup trigger (migration 021) when auth.signUp is called
    // directly with the public anon key, bypassing the check above.
    const raw = error.message.toLowerCase();
    if (raw.includes("under_18") || raw.includes("birth_date_required")) {
      return { error: "You must be 18 or older to register." };
    }
    return { error: error.message };
  }

  // If no session, Supabase requires email confirmation before login
  const needsConfirmation = !signUpData?.session;
  return { error: null, needsConfirmation };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error && process.env.NODE_ENV !== "production") {
    console.error("[signOut]", error.message);
  }
  redirect("/login");
}
