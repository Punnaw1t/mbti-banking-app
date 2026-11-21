import { NextResponse } from "next/server";
import { endSession, handle } from "@/lib/server/auth";

export const POST = handle(async () => {
  await endSession();
  return NextResponse.json({ ok: true });
});
