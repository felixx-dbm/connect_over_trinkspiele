import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — initialized on first use, not at module evaluation time.
// This prevents Next.js from crashing during build when SUPABASE_SERVICE_ROLE_KEY is absent.
let _client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  return (_client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ));
}

export const adminClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return Reflect.get(getClient(), prop);
  },
});
