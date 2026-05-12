"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export async function signUp(data: {
  username: string;
  email: string;
  password: string;
  dob: string;
}): Promise<{ error: string | null; needsConfirmation?: boolean }> {
  if (getAge(data.dob) < 18) {
    return { error: "You must be 18 or older to register." };
  }

  if (data.password.length < 8 || data.password.length > 72) {
    return { error: "Password must be between 8 and 72 characters." };
  }

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

  if (error) return { error: error.message };

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
