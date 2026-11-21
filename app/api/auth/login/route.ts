import { NextResponse } from "next/server";
import { handle, jsonError, startSession } from "@/lib/server/auth";
import { pool, toUser, USER_SELECT } from "@/lib/server/db";

export const POST = handle(async (req: Request) => {
  const { username, password, department } = await req.json().catch(() => ({}));
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return jsonError("Enter your username and password.", 400);
  }

  // The password check happens inside Postgres (bcrypt via pgcrypto).
  const { rows } = await pool().query(
    `${USER_SELECT}
     WHERE lower(u.username) = lower($1)
       AND u.password_hash = crypt($2, u.password_hash)`,
    [username.trim(), password],
  );
  if (!rows[0]) return jsonError("Incorrect username or password.", 401);

  const user = toUser(rows[0]);
  if (user.department !== department) {
    return jsonError("Selected department does not match this account's record.", 401);
  }

  await startSession(user.id);
  return NextResponse.json({ user });
});
