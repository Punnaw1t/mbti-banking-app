import { NextResponse } from "next/server";
import { handle, jsonError, requireUser } from "@/lib/server/auth";
import { getUserById, pool } from "@/lib/server/db";
import { OceanTrait } from "@/lib/types";

const TRAITS: OceanTrait[] = ["O", "C", "E", "A", "N"];

// Save (or replace) the signed-in employee's OCEAN result.
export const PUT = handle(async (req: Request) => {
  const g = await requireUser();
  if (g.error) return g.error;
  if (g.user.isHrFlow) return jsonError("HR and management accounts don't take the assessment.", 403);

  const { scores } = await req.json().catch(() => ({}));
  const valid =
    scores && TRAITS.every((t) => Number.isInteger(scores[t]) && scores[t] >= 10 && scores[t] <= 50);
  if (!valid) return jsonError("Each OCEAN score must be a whole number from 10 to 50.", 400);

  await pool().query(
    `INSERT INTO test_results (user_id, o, c, e, a, n, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (user_id) DO UPDATE
       SET o = EXCLUDED.o, c = EXCLUDED.c, e = EXCLUDED.e, a = EXCLUDED.a, n = EXCLUDED.n,
           completed_at = EXCLUDED.completed_at`,
    [g.user.id, scores.O, scores.C, scores.E, scores.A, scores.N],
  );
  return NextResponse.json({ user: await getUserById(g.user.id) });
});
