import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

const APP_ROUTES = ["/home", "/map", "/leaderboard", "/crews", "/matches", "/profile", "/settings", "/events", "/crew-matches", "/challenge"];
const AUTH_ROUTES = ["/login", "/register"];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), camera=(), microphone=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// Copy refreshed session cookies from supabaseResponse onto the redirect so tokens aren't lost
function redirectWithCookies(to: URL, cookieSource: NextResponse): NextResponse {
  const response = NextResponse.redirect(to);
  cookieSource.cookies.getAll().forEach(({ name, value, ...rest }) => {
    response.cookies.set(name, value, rest);
  });
  return applySecurityHeaders(response);
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // --- Rate limiting (before auth to avoid wasteful Supabase calls) ---
  if (pathname.startsWith("/api/")) {
    // Map challenges are expensive (PostGIS); limit harder
    const isMap = pathname.startsWith("/api/map/");
    const isMatchmaking = pathname.startsWith("/api/matchmaking/");
    const bucket = isMap ? "map" : isMatchmaking ? "matchmaking" : "api";
    const limit = isMap ? 12 : isMatchmaking ? 20 : 40;
    const windowMs = 60_000;

    if (!checkRateLimit(ip, bucket, limit, windowMs)) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }
  }

  // Stricter limit on auth pages to slow brute-force / credential stuffing
  if (pathname === "/login" || pathname === "/register") {
    if (!checkRateLimit(ip, "auth", 10, 60_000)) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  // --- Auth ---
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() verifies the JWT server-side — never use getSession() in middleware
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && process.env.NODE_ENV !== "production") {
    console.error("[middleware] getUser error:", error.message);
  }

  // Exact match or sub-path — prevents /profileX matching /profile
  const isAppRoute = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return redirectWithCookies(url, supabaseResponse);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return redirectWithCookies(url, supabaseResponse);
  }

  return applySecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
