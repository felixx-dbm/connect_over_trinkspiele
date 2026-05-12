/** Validates a redirect path is same-origin. Blocks protocol-relative attacks like //evil.com */
export function safeRedirect(path: string | null | undefined): string {
  if (!path) return "/home";
  try {
    const url = new URL(path, "http://localhost");
    return url.origin === "http://localhost" ? url.pathname + url.search : "/home";
  } catch {
    return "/home";
  }
}
