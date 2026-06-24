export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-200/50 blur-3xl animate-blob pointer-events-none" />
      <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-rose-200/35 blur-3xl animate-blob-2 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-violet-200/28 blur-3xl animate-blob-3 pointer-events-none" />
      <div className="relative z-10 max-w-sm mx-auto w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
