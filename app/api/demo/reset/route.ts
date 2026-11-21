import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { endSession, handle, jsonError } from "@/lib/server/auth";
import { withTransaction } from "@/lib/server/db";

// "Reset demo data" on the login page: wipe every table and re-run the seed.
// Disabled in production so a real deployment can't be wiped from the login screen.
export const POST = handle(async () => {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESET !== "true") {
    return jsonError("Demo reset is disabled in production.", 403);
  }
  const seed = await readFile(path.join(process.cwd(), "db/init/02_seed.sql"), "utf8");
  await withTransaction(async (c) => {
    await c.query("TRUNCATE sessions, email_log, dashboards, test_results, users");
    await c.query(seed);
  });
  await endSession();
  return NextResponse.json({ ok: true });
});
