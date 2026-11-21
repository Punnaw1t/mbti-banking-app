import { NextResponse } from "next/server";
import { pool } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const TABLES = ["departments", "users", "test_results", "email_log", "dashboards", "sessions"] as const;

// GET /api/health — is the database reachable, and how many rows does each table hold?
export async function GET() {
  try {
    const started = Date.now();
    const { rows } = await pool().query(
      `SELECT ${TABLES.map((t) => `(SELECT count(*)::int FROM ${t}) AS ${t}`).join(", ")}, version() AS version`,
    );
    const { version, ...counts } = rows[0];
    return NextResponse.json({
      status: "ok",
      database: "connected",
      latencyMs: Date.now() - started,
      postgres: String(version).split(" ").slice(0, 2).join(" "),
      tables: counts,
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", database: "unreachable", error: (err as Error).message || String((err as { code?: string }).code ?? err) },
      { status: 503 },
    );
  }
}
