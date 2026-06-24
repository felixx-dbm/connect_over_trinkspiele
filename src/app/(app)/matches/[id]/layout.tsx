import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: match } = await supabase
    .from("matches")
    .select("custom_game_name, game_types(name), challenger:challenger_id(username)")
    .eq("id", id)
    .single();

  if (!match) return { title: "Battle — Prost" };

  const gameName = match.custom_game_name
    ?? (match.game_types as unknown as { name: string } | null)?.name?.replace(/_/g, " ") ?? "battle";
  const challenger = (match.challenger as unknown as { username: string } | null)?.username ?? "Someone";
  const title = `${challenger} posted a ${gameName} challenge`;

  return {
    title: `${title} — Prost`,
    openGraph: {
      title,
      description: `Join the battle on Prost 🍺`,
      siteName: "Prost",
    },
    twitter: {
      card: "summary",
      title,
      description: "Join the battle on Prost 🍺",
    },
  };
}

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
