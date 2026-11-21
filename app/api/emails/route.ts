import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { handle, jsonError, requireHr } from "@/lib/server/auth";
import { pool, toEmail } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const g = await requireHr();
  if (g.error) return g.error;
  const { rows } = await pool().query("SELECT * FROM email_log ORDER BY sent_at DESC");
  return NextResponse.json({ emails: rows.map(toEmail) });
});

// Log a follow-up email. The sender is always the signed-in user.
export const POST = handle(async (req: Request) => {
  const g = await requireHr();
  if (g.error) return g.error;

  const { toUserId, subject, body } = await req.json().catch(() => ({}));
  if (typeof subject !== "string" || typeof body !== "string" || !subject.trim()) {
    return jsonError("Missing email subject or body.", 400);
  }
  const target = await pool().query("SELECT email FROM users WHERE id = $1", [toUserId]);
  if (!target.rowCount) return jsonError("That employee no longer exists.", 404);

  const { rows } = await pool().query(
    `INSERT INTO email_log (id, to_user_id, to_email, subject, body, sent_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ["e-" + randomUUID(), toUserId, target.rows[0].email, subject, body, g.user.name],
  );
  return NextResponse.json({ email: toEmail(rows[0]) }, { status: 201 });
});
