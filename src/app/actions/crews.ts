"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCrew(name: string, city: string): Promise<{ error: string | null; crewId?: string }> {
  if (!name.trim()) return { error: "Crew name is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // One crew per user. The embedded filter needs an !inner join on crews —
  // without it PostgREST errors, the error is swallowed, and the guard never
  // fires. Surface the failure rather than letting a user join a second crew.
  const { data: existing, error: existingError } = await supabase
    .from("crew_members")
    .select("crew_id, crews!inner(deleted_at)")
    .eq("user_id", user.id)
    .is("crews.deleted_at", null)
    .maybeSingle();

  if (existingError) return { error: "Could not verify your crew membership. Try again." };
  if (existing) return { error: "You are already in a crew." };

  const { data: crew, error: crewError } = await supabase
    .from("crews")
    .insert({ name: name.trim(), city: city.trim() || null, captain_id: user.id })
    .select("id")
    .single();

  if (crewError) return { error: crewError.message };

  const { error: memberError } = await supabase
    .from("crew_members")
    .insert({ crew_id: crew.id, user_id: user.id, role: "captain" });

  if (memberError) {
    if (memberError.code === "23505") return { error: "You are already in a crew." };
    return { error: memberError.message };
  }

  revalidatePath("/crews");
  return { error: null, crewId: crew.id };
}

export async function joinCrew(inviteCode: string): Promise<{ error: string | null }> {
  if (!inviteCode.trim()) return { error: "Invite code is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existing, error: existingError } = await supabase
    .from("crew_members")
    .select("crew_id, crews!inner(deleted_at)")
    .eq("user_id", user.id)
    .is("crews.deleted_at", null)
    .maybeSingle();

  if (existingError) return { error: "Could not verify your crew membership. Try again." };
  if (existing) return { error: "You are already in a crew." };

  const { data: crew } = await supabase
    .from("crews")
    .select("id")
    .eq("invite_code", inviteCode.trim().toUpperCase())
    .is("deleted_at", null)
    .maybeSingle();

  if (!crew) return { error: "Invalid invite code." };

  const { error } = await supabase
    .from("crew_members")
    .insert({ crew_id: crew.id, user_id: user.id, role: "member" });

  if (error) {
    // Unique constraint on user_id fires if they raced into another crew
    if (error.code === "23505") return { error: "You are already in a crew." };
    return { error: error.message };
  }

  revalidatePath("/crews");
  return { error: null };
}

export async function leaveCrew(crewId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // 1. Mitglieder der Crew abfragen
  const { data: members, error: membersError } = await supabase
    .from("crew_members")
    .select("user_id, role")
    .eq("crew_id", crewId);

  if (membersError || !members) {
    return { error: membersError?.message || "Crew not found." };
  }

  const isOnlyMember = members.length === 1;
  const userMember = members.find(m => m.user_id === user.id);

  if (!userMember) {
    return { error: "You are not a member of this crew." };
  }

  // 2. Captain leaving
  if (userMember.role === "captain") {
    if (!isOnlyMember) {
      return {
        error: "As captain, you cannot leave the crew. Assign a new captain or delete the crew.",
      };
    }

    // Archive the crew BEFORE dropping the membership. The old order deleted the
    // membership first, so a failed archive left a crew with no members at all —
    // and the archive always failed, because crews.deleted_at did not exist
    // until migration 022.
    const { error: softDeleteError } = await supabase
      .from("crews")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", crewId);

    if (softDeleteError) {
      return { error: `Failed to archive crew: ${softDeleteError.message}` };
    }

    const { error: deleteMemberError } = await supabase
      .from("crew_members")
      .delete()
      .eq("crew_id", crewId)
      .eq("user_id", user.id);

    if (deleteMemberError) {
      // Put the crew back so the captain isn't left in an archived crew.
      await supabase.from("crews").update({ deleted_at: null }).eq("id", crewId);
      return { error: deleteMemberError.message };
    }

    revalidatePath("/crews");
    return { error: null };
  }

  // 3. Normales Mitglied verlässt die Crew
  const { error } = await supabase
    .from("crew_members")
    .delete()
    .eq("crew_id", crewId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/crews");
  return { error: null };
}
