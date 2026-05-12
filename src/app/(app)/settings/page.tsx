import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Edit3, User, Mail, MapPin } from "lucide-react";
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Account</p>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <Edit3 size={12} />
            Edit Profile
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <User size={14} className="text-zinc-600 flex-shrink-0" />
            <span className="text-zinc-400 text-sm flex-1">Username</span>
            <span className="text-zinc-200 text-sm font-medium">{profile?.username ?? "—"}</span>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex items-center gap-3">
            <MapPin size={14} className="text-zinc-600 flex-shrink-0" />
            <span className="text-zinc-400 text-sm flex-1">City</span>
            {profile?.city ? (
              <span className="text-zinc-200 text-sm font-medium">{profile.city}</span>
            ) : (
              <Link href="/profile" className="text-amber-400 text-sm hover:text-amber-300 transition-colors cursor-pointer">
                Set city →
              </Link>
            )}
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex items-center gap-3">
            <Mail size={14} className="text-zinc-600 flex-shrink-0" />
            <span className="text-zinc-400 text-sm flex-1">Email</span>
            <span className="text-zinc-200 text-sm font-medium truncate max-w-[160px]">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Coming soon features */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">More Settings</p>
        <div className="flex flex-col gap-3">
          <p className="text-zinc-600 text-sm">
            Notifications, privacy controls, and language preferences are in development.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Push Notifications", "Location Privacy", "Language"].map((label) => (
              <span
                key={label}
                className="text-xs bg-zinc-800 text-zinc-600 border border-zinc-700 px-3 py-1 rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-zinc-900 border border-red-500/10 rounded-2xl p-4 mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Danger Zone</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-400/50 text-sm">
            <Trash2 size={16} />
            Delete Account
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-600 border border-zinc-700 px-2.5 py-1 rounded-full">Coming Soon</span>
        </div>
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
