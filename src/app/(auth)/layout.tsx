export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
