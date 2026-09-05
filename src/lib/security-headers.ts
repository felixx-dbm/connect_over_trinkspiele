/**
 * Single source of truth for security response headers.
 *
 * Applied in two places, which must not drift:
 *   - next.config.ts  — every normal route response
 *   - proxy.ts        — responses the middleware builds itself (redirects, 429s)
 *
 * Origins in play:
 *   - Supabase REST/auth/storage + realtime websockets
 *   - CARTO basemap tiles used by the Leaflet map
 *   - next/font/google self-hosts its fonts at build time, so no external font
 *     origin is needed
 *
 * 'unsafe-inline' stays on script-src because the App Router emits inline
 * bootstrap/flight scripts and nothing here mints a per-request nonce; moving to
 * nonces would mean generating one in proxy.ts and threading it through the
 * document. Dev additionally needs 'unsafe-eval' for React Refresh.
 */
export function buildCsp(isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.basemaps.cartocdn.com",
    "font-src 'self' data:",
    // ws://localhost is for the dev-server HMR socket; some browsers do not treat
    // a ws:// origin as matching 'self'.
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaders(isDev: boolean): Record<string, string> {
  return {
    "Content-Security-Policy": buildCsp(isDev),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(self), camera=(), microphone=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    // X-XSS-Protection is deliberately absent: the legacy auditor it enables is
    // removed from modern browsers and its filter introduced its own injection
    // bugs. The CSP above is the real protection.
  };
}
