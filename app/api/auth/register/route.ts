import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { handle, jsonError, startSession } from "@/lib/server/auth";
import { getUserById, pool } from "@/lib/server/db";

export const POST = handle(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const department = String(body.department ?? "");

  if (!name || !username || !email) return jsonError("Please fill in every field.", 400);
  if (/\s/.test(username)) return jsonError("Username cannot contain spaces.", 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonError("Enter a valid email address.", 400);
  if (password.length < 6) return jsonError("Password should be at least 6 characters.", 400);

  const dept = await pool().query("SELECT 1 FROM departments WHERE name = $1", [department]);
  if (!dept.rowCount) return jsonError("Unknown department.", 400);

  const taken = await pool().query("SELECT 1 FROM users WHERE lower(username) = lower($1)", [username]);
  if (taken.rowCount) return jsonError("That username is already taken.", 409);

  const id = "u-" + randomUUID();
  try {
    await pool().query(
      `INSERT INTO users (id, name, username, password_hash, email, department)
       VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5, $6)`,
      [id, name, username, password, email, department],
    );
  } catch (err) {
    // Two sign-ups racing for the same username hit the unique index.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.code === "23505") return jsonError("That username is already taken.", 409);
    throw err;
  }

  await startSession(id);
  return NextResponse.json({ user: await getUserById(id) }, { status: 201 });
});
