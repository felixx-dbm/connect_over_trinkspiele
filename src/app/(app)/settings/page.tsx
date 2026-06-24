import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, User, Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import EditAccountButton from "./EditAccountButton";

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
        <Link href="/profile" className="w-9 h-9 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-stone-500 hover:border-amber-300 transition-colors cursor-pointer shadow-sm">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl text-stone-900">
          SET<span className="text-gradient">TINGS</span>
        </h1>
      </div>

      {/* Account info */}
      <div className="bg-white border border-amber-100 rounded-3xl p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Account</p>
          <EditAccountButton username={profile?.username ?? ""} city={profile?.city ?? ""} />
        </div>
        <div className="flex flex-col">
          {[
            { Icon: User,  label: "Username", value: profile?.username ?? "—"   },
            { Icon: MapPin,label: "City",     value: profile?.city ?? null      },
            { Icon: Mail,  label: "Email",    value: user.email ?? "—"          },
          ].map(({ Icon, label, value }, i) => (
            <div key={label}>
              {i !== 0 && <div className="h-px bg-amber-50 mx-1" />}
              <div className="flex items-center gap-3 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-amber-500" />
                </div>
                <span className="text-stone-500 text-sm font-semibold flex-1">{label}</span>
                <span className={`text-sm font-bold truncate max-w-[160px] ${value ? "text-stone-800" : "text-stone-300"}`}>
                  {value ?? "Not set"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-3 border-t border-amber-50">
          <EditAccountButton username={profile?.username ?? ""} city={profile?.city ?? ""} fullWidth />
        </div>
      </div>

      {/* Coming soon */}
      <div className="bg-white border border-amber-100 rounded-3xl p-5 mb-4 shadow-sm">
        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">Coming Soon</p>
        <p className="text-stone-500 text-sm font-semibold mb-3 leading-relaxed">
          Push notifications, location privacy controls, and language preferences are in development.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Push Notifications", "Location Privacy", "Language"].map((label) => (
            <span key={label} className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-full font-bold">
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-rose-100 rounded-3xl p-5 mb-6 shadow-sm">
        <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-3">Danger Zone</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <Trash2 size={13} className="text-rose-400" />
            </div>
            <span className="text-stone-500 text-sm font-semibold">Delete Account</span>
          </div>
          <span className="text-xs bg-stone-100 text-stone-400 border border-stone-200 px-2.5 py-1 rounded-full font-bold">Soon</span>
        </div>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full h-12 flex items-center justify-center text-rose-500 border border-rose-200 hover:bg-rose-50 rounded-2xl text-sm font-bold transition-all cursor-pointer"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
