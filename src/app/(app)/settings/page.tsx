import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Shield, Trash2, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("username, city")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen px-4 pt-12 pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile" className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-xl text-zinc-100">
          SETTINGS
        </h1>
      </div>

      {/* Account info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Account</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Username</span>
            <span className="text-zinc-200 text-sm font-medium">{profile?.username ?? "—"}</span>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">City</span>
            <span className="text-zinc-200 text-sm font-medium">{profile?.city ?? "Not set"}</span>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Email</span>
            <span className="text-zinc-200 text-sm font-medium">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-5">
        {[
          { label: "Notifications", sublabel: "Push & in-app alerts", Icon: Bell },
          { label: "Privacy", sublabel: "Location & visibility", Icon: Shield },
          { label: "Language", sublabel: "English", Icon: Globe },
        ].map(({ label, sublabel, Icon }, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-4 py-4 ${i !== 0 ? "border-t border-zinc-800" : ""}`}
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-zinc-200 text-sm font-medium">{label}</p>
              <p className="text-zinc-600 text-xs">{sublabel}</p>
            </div>
            <span className="text-zinc-700 text-xs">Soon</span>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="bg-zinc-900 border border-red-500/10 rounded-2xl p-4 mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Danger Zone</p>
        <button className="flex items-center gap-3 text-red-400 text-sm w-full cursor-pointer hover:text-red-300 transition-colors">
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full h-12 flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500/5 rounded-2xl text-sm font-medium transition-all cursor-pointer"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
