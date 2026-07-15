"use client";

/**
 * Notification bell with unread badge and a dropdown panel
 * listing challenge, match and crew notifications.
 */
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_EMOJI: Record<string, string> = {
  match_accepted:   "⚔️",
  result_confirmed: "✅",
  result_disputed:  "⚠️",
  direct_challenge: "📲",
  default:          "🍺",
};

export default function NotificationBell() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  const fetchNotifs = async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, url, read, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifs(data as Notification[]);
  };

  //get userId
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        fetchNotifs(data.user.id);
      }
    });
  }, []);

  // Realtime erst, wenn User da ist
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
  
    const uniqueChannelName = `user-notifs-${userId}-${Date.now()}`;
    const channel = supabase.channel(uniqueChannelName);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifs((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Successfully subscribed to channel: ${uniqueChannelName}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Keep relative timestamps ("5m ago") fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = async () => {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      const supabase = createClient();
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }
    setOpen(false);
    if (n.url) router.push(n.url);
  };

  const timeAgo = (iso: string) => {
    const diff = Math.floor((now - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open && userId) fetchNotifs(userId); }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative w-9 h-9 border border-[#14110F] flex items-center justify-center hover:bg-[#14110F] hover:text-[#FAF8F3] transition-colors cursor-pointer"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-[#FAF8F3] border border-[#14110F] overflow-hidden z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3DCCB]">
            <p className="font-bold text-sm">Notifications</p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-amber-700 font-bold flex items-center gap-1 hover:text-amber-800 cursor-pointer">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close notifications" className="text-[#6B5D42] hover:text-[#14110F] cursor-pointer">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-10 text-[#6B5D42]">
                <Bell size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-amber-50 transition-colors cursor-pointer border-b border-[#E3DCCB] last:border-0 ${!n.read ? "bg-amber-50/60" : ""}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {TYPE_EMOJI[n.type] ?? TYPE_EMOJI.default}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${!n.read ? "font-bold" : "font-medium"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-[#6B5D42] font-medium flex-shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-[#4A3F2C] font-medium mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-amber-600 flex-shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
