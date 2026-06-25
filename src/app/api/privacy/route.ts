import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED: readonly string[] = ["show_on_leaderboard", "allow_direct_challenges", "share_location"];

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { key: string; value: unknown };
  if (!ALLOWED.includes(body.key) || typeof body.value !== "boolean") {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ [body.key]: body.value })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
