import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { securityHeaders } from "@/lib/security-headers";

const APP_ROUTES = ["/home", "/map", "/leaderboard", "/crews", "/matches", "/profile", "/settings", "/events", "/crew-matches", "/challenge"];
const AUTH_ROUTES = ["/login", "/register"];

// Shared with next.config.ts so the two sets can't drift apart.
const SECURITY_HEADERS = securityHeaders(process.env.NODE_ENV !== "production");

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

/**
 * Resolve the client IP for rate limiting.
 *
 * x-forwarded-for's FIRST entry is whatever the client sent — anyone can put a
 * random value there and get a fresh bucket every request, which defeated the
 * brute-force limit on /login entirely. Prefer the headers the platform sets
 * itself, and fall back to the LAST x-forwarded-for entry (appended by the
 * closest proxy) rather than the first.
 */
function getClientIp(request: NextRequest): string {
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return "unknown";
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
      return applySecurityHeaders(
        new NextResponse(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "60" },
        })
      );
    }
  }

  // Stricter limit on auth pages to slow brute-force / credential stuffing
  if (pathname === "/login" || pathname === "/register") {
    if (!checkRateLimit(ip, "auth", 10, 60_000)) {
      return applySecurityHeaders(
        new NextResponse("Too many requests", { status: 429, headers: { "Retry-After": "60" } })
      );
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
