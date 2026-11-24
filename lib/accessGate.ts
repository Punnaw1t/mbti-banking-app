// Site-wide access code checked before the login page.
// The code itself lives only in the ACCESS_CODE env var (.env.local / hosting
// settings), never in the repo. Uses Web Crypto so it runs in middleware (Edge)
// as well as in route handlers.

export const ACCESS_COOKIE = "meridian_access";
export const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Cookie value proving the visitor entered the code. Derived from the code, so
// changing ACCESS_CODE signs everyone out of the gate.
export async function accessToken(): Promise<string | null> {
  const code = process.env.ACCESS_CODE;
  if (!code) return null;
  const data = new TextEncoder().encode(`meridian-access:${code}`);
  return hex(await crypto.subtle.digest("SHA-256", data));
}

// Constant-time string compare.
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hasAccess(cookieValue: string | undefined) {
  const token = await accessToken();
  return !!token && !!cookieValue && safeEqual(cookieValue, token);
}
