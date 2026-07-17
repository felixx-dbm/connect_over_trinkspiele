import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeRedirect } from "@/lib/redirect";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirect(searchParams.get("next"));

  if (code) {
    const type = searchParams.get("type");
    const redirectUrl =
      type === "recovery" ? `${origin}/reset-password` : `${origin}${next}`;

    // Build the response first so Supabase can write Set-Cookie headers onto it.
    // Using createClient() here would set cookies on Next.js's internal store,
    // which is NOT transferred to a new NextResponse — leaving the browser cookieless.
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
