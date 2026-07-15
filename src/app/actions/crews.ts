"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCrew(name: string, city: string): Promise<{ error: string | null; crewId?: string }> {
  if (!name.trim()) return { error: "Crew name is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // One crew per user — check if already in one
  const { data: existing } = await supabase
    .from("crew_members")
    .select("crew_id")
    .eq("user_id", user.id)
    .is("crews.deleted_at", null)
    .maybeSingle();

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

  const { data: existing } = await supabase
    .from("crew_members")
    .select("crew_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { error: "You are already in a crew." };

  const { data: crew } = await supabase
    .from("crews")
    .select("id")
    .eq("invite_code", inviteCode.trim().toUpperCase())
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

  // 2. Wenn der User der Captain ist
  if (userMember.role === "captain") {
  if (isOnlyMember) {
    // 1. Crew-Mitgliedschaft aufheben
    const { error: deleteMemberError } = await supabase
      .from("crew_members")
      .delete()
      .eq("crew_id", crewId)
      .eq("user_id", user.id);

    if (deleteMemberError) return { error: deleteMemberError.message };

    // Crew wird als gelöscht markiert
    const { error: softDeleteError } = await supabase
      .from("crews")
      .update({ deleted_at: new Date().toISOString() }) // Zeitstempel setzen
      .eq("id", crewId);

    if (softDeleteError) {
      // Rollback, falls das Archivieren fehlschlägt
      await supabase
        .from("crew_members")
        .insert({ crew_id: crewId, user_id: user.id, role: "captain" });
        
      return { error: `Failed to archive crew: ${softDeleteError.message}` };
    }
    
    revalidatePath("/crews");
    return { error: null };
  } else {
    return { 
      error: "As captain, you cannot leave the crew. Assign a new captain or delete the crew." 
    };
  }
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
