"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(username: string, city: string): Promise<{ error?: string }> {
  const trimmedUsername = username.trim();
  const trimmedCity = city.trim();

  if (!trimmedUsername || trimmedUsername.length < 2 || trimmedUsername.length > 30) {
    return { error: "Username must be 2–30 characters" };
  }
  if (trimmedCity.length > 60) {
    return { error: "City must be 60 characters or fewer" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("users")
    .update({ username: trimmedUsername, city: trimmedCity || null })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "Username already taken" };
    return { error: "Failed to update profile" };
  }

  revalidatePath("/profile");
  return {};
}
