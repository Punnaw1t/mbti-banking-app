// Cookie-based sessions backed by the `sessions` table.
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { User } from "@/lib/types";
import { getUserById, pool } from "./db";

export const SESSION_COOKIE = "meridian_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // keep in sync with sessions.expires_at default

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await pool().query(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + make_interval(secs => $3))",
    [token, userId, MAX_AGE_SECONDS],
  );
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await pool().query("DELETE FROM sessions WHERE token = $1", [token]);
  cookies().delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | undefined> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return undefined;
  const { rows } = await pool().query(
    "SELECT user_id FROM sessions WHERE token = $1 AND expires_at > now()",
    [token],
  );
  if (!rows[0]) return undefined;
  return getUserById(rows[0].user_id);
}

// --- Route helpers ---------------------------------------------------------
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type Guarded = { user: User; error?: never } | { user?: never; error: NextResponse };

export async function requireUser(): Promise<Guarded> {
  const user = await currentUser();
  if (!user) return { error: jsonError("Your session has expired. Please sign in again.", 401) };
  return { user };
}

export async function requireHr(): Promise<Guarded> {
  const g = await requireUser();
  if (g.error) return g;
  if (!g.user.isHrFlow) return { error: jsonError("This page is for HR and management accounts only.", 403) };
  return g;
}

// Wraps a route handler so a DB outage returns a clear 503 instead of a stack trace.
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[api]", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (err as any)?.code;
      if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "57P03" || code === "3D000") {
        return jsonError("Can't reach the database. Is it running? Try `docker compose up -d`.", 503);
      }
      return jsonError("Something went wrong on the server.", 500);
    }
  };
}
