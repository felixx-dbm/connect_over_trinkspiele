import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeRedirect } from "@/lib/redirect";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirect(searchParams.get("next"));

  // Supabase sends ?error= instead of ?code= when OAuth fails on their end
  const oauthError = searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=${oauthError}`);
  }

  if (code) {
    const type = searchParams.get("type");
    const redirectUrl =
      type === "recovery" ? `${origin}/reset-password` : `${origin}${next}`;

    // Build response first so Supabase writes Set-Cookie headers directly onto it.
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
    const errorCode = error.message.toLowerCase().includes("already")
      ? "email_conflict"
      : "oauth_failed";
    return NextResponse.redirect(`${origin}/login?error=${errorCode}`);
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
