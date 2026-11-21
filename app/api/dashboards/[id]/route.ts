import { NextResponse } from "next/server";
import { handle, requireHr } from "@/lib/server/auth";
import { pool } from "@/lib/server/db";

export const DELETE = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  const g = await requireHr();
  if (g.error) return g.error;
  await pool().query("DELETE FROM dashboards WHERE id = $1", [params.id]);
  return NextResponse.json({ ok: true });
});
