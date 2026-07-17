import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = user.id;

  // Delete avatar from storage
  const { data: avatarFiles } = await adminClient.storage.from("avatars").list(uid);
  if (avatarFiles?.length) {
    await adminClient.storage
      .from("avatars")
      .remove(avatarFiles.map((f) => `${uid}/${f.name}`));
  }

  // Delete auth user — migration 020 CASCADE constraints handle all related data
  const { error } = await adminClient.auth.admin.deleteUser(uid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
