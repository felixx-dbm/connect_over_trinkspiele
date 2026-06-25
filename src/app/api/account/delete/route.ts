import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = user.id;

  // 1. Delete avatar from storage
  const { data: avatarFiles } = await adminClient.storage
    .from("avatars")
    .list(uid);
  if (avatarFiles && avatarFiles.length > 0) {
    await adminClient.storage
      .from("avatars")
      .remove(avatarFiles.map((f) => `${uid}/${f.name}`));
  }

  // 2. Clean up related data that may not cascade
  await adminClient.from("match_members").delete().eq("user_id", uid);
  await adminClient.from("crew_members").delete().eq("user_id", uid);
  await adminClient.from("event_members").delete().eq("user_id", uid);
  await adminClient.from("notifications").delete().eq("user_id", uid);

  // Cancel open matches where user is the challenger
  await adminClient
    .from("matches")
    .update({ status: "cancelled" })
    .eq("challenger_id", uid)
    .eq("status", "open");

  // Vacate opponent slot in open matches the user joined
  await adminClient
    .from("matches")
    .update({ opponent_id: null, status: "open" })
    .eq("opponent_id", uid)
    .eq("status", "active");

  // 3. Delete auth user — cascades to public.users via FK
  const { error } = await adminClient.auth.admin.deleteUser(uid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
