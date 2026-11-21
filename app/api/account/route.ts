import { NextResponse } from "next/server";
import { handle, jsonError, requireUser } from "@/lib/server/auth";
import { getUserById, pool } from "@/lib/server/db";

// Change the signed-in user's own username and/or password.
export const PATCH = handle(async (req: Request) => {
  const g = await requireUser();
  if (g.error) return g.error;
  const me = g.user;

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword ?? "");
  const username = String(body.newUsername ?? "").trim();
  const newPassword = String(body.newPassword ?? "");

  const ok = await pool().query(
    "SELECT 1 FROM users WHERE id = $1 AND password_hash = crypt($2, password_hash)",
    [me.id, currentPassword],
  );
  if (!ok.rowCount) return jsonError("Current password is incorrect.", 400);

  if (!username) return jsonError("Username cannot be empty.", 400);
  if (/\s/.test(username)) return jsonError("Username cannot contain spaces.", 400);
  const taken = await pool().query(
    "SELECT 1 FROM users WHERE lower(username) = lower($1) AND id <> $2",
    [username, me.id],
  );
  if (taken.rowCount) return jsonError("That username is already taken.", 409);

  if (newPassword && newPassword.length < 6) return jsonError("New password should be at least 6 characters.", 400);
  const samePassword = !newPassword || newPassword === currentPassword;
  if (username === me.username && samePassword) {
    return jsonError("Nothing to change. Enter a new username or a new password.", 400);
  }

  await pool().query(
    `UPDATE users
        SET username = $2,
            password_hash = CASE WHEN $3 = '' THEN password_hash ELSE crypt($3, gen_salt('bf')) END
      WHERE id = $1`,
    [me.id, username, samePassword ? "" : newPassword],
  );
  return NextResponse.json({ user: await getUserById(me.id) });
});
