import { NextResponse } from "next/server";
import { currentUser, handle } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

// The signed-in user, or { user: null }.
export const GET = handle(async () => {
  return NextResponse.json({ user: (await currentUser()) ?? null });
});
