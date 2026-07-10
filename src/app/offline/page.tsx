export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="text-5xl">📡</div>
      <h1 className="font-display text-2xl text-[#14110F]">You&apos;re offline</h1>
      <p className="text-sm text-[#14110F]/60 max-w-xs">
        Prost needs a connection to load matches, crews and the map. Reconnect and try again.
      </p>
    </main>
  );
}
