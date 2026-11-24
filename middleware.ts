import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, hasAccess } from "@/lib/accessGate";

// Everything except the splash, the access-code page and its API needs the
// access cookie. Pages redirect to /access; API calls get a 401.
const OPEN_PATHS = new Set(["/", "/access", "/api/access", "/api/health"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN_PATHS.has(pathname)) return NextResponse.next();
  if (await hasAccess(req.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Enter the access code first." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/access";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals and files in /public (anything with an extension).
  matcher: ["/((?!_next/|.*\\.[^/]+$).*)"],
};
