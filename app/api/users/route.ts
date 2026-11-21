import { NextResponse } from "next/server";
import { handle, requireHr } from "@/lib/server/auth";
import { getScopedEmployees } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// Employees (non Flow-2 accounts) the signed-in HR/management user may see.
// The department scope is enforced here, not only in the UI.
export const GET = handle(async () => {
  const g = await requireHr();
  if (g.error) return g.error;
  return NextResponse.json({ users: await getScopedEmployees(g.user) });
});
