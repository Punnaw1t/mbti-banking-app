import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, ACCESS_MAX_AGE_SECONDS, accessToken, hasAccess, safeEqual } from "@/lib/accessGate";

export const dynamic = "force-dynamic";

// GET /api/access — has this browser entered the access code?
export async function GET() {
  return NextResponse.json({ granted: await hasAccess(cookies().get(ACCESS_COOKIE)?.value) });
}

// POST /api/access { code } — check the code and remember it in a cookie.
export async function POST(req: Request) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Access code is not configured on the server (ACCESS_CODE)." }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!safeEqual(code, process.env.ACCESS_CODE!)) {
    // Small delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Incorrect access code." }, { status: 401 });
  }
  cookies().set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
  return NextResponse.json({ granted: true });
}
