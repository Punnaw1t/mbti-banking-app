import { NextResponse } from "next/server";
import { handle, jsonError, requireHr } from "@/lib/server/auth";
import { pool, toDashboard } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const g = await requireHr();
  if (g.error) return g.error;
  const { rows } = await pool().query("SELECT * FROM dashboards ORDER BY created_at DESC");
  return NextResponse.json({ dashboards: rows.map(toDashboard) });
});

// Save dashboard metadata. Uploaded file bodies stay in the browser's IndexedDB
// (lib/dashboardFiles.ts); only their name/type/size are stored here.
export const POST = handle(async (req: Request) => {
  const g = await requireHr();
  if (g.error) return g.error;

  const d = await req.json().catch(() => ({}));
  const title = String(d.title ?? "").trim();
  const source = d.source === "file" ? "file" : "link";
  const url = source === "link" ? String(d.url ?? "") : "";
  if (typeof d.id !== "string" || !d.id) return jsonError("Missing dashboard id.", 400);
  if (!title) return jsonError("Give the dashboard a name.", 400);
  if (source === "link" && !url.startsWith("https://")) return jsonError("Embed links must start with https://", 400);
  if (source === "file" && !d.file?.name) return jsonError("Missing file details.", 400);

  const { rows } = await pool().query(
    `INSERT INTO dashboards (id, title, source, url, file_name, file_type, file_size, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      d.id, title, source, url,
      d.file?.name ?? null, d.file?.type ?? null, d.file?.size ?? null,
      d.description?.trim() || null, g.user.name,
    ],
  );
  return NextResponse.json({ dashboard: toDashboard(rows[0]) }, { status: 201 });
});
