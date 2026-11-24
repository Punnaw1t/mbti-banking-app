// Server-only Postgres access. Never import this from a "use client" file.
import { Pool, PoolClient } from "pg";
import { Department, EmailLogEntry, SavedDashboard, User, getViewableDepartments } from "@/lib/types";

declare global {
  // Reuse one pool across Next.js dev hot reloads.
  // eslint-disable-next-line no-var
  var __meridianPool: Pool | undefined;
}

export function pool(): Pool {
  if (!global.__meridianPool) {
    // DATABASE_URL locally; POSTGRES_URL is what Vercel's Neon / Postgres
    // integrations inject, so either works on Vercel. Hosted providers put
    // `?sslmode=require` in the URL, which pg uses to turn on TLS.
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and start the DB with `docker compose up -d` (on Vercel: set DATABASE_URL in Project Settings → Environment Variables).");
    }
    global.__meridianPool = new Pool({
      connectionString,
      // Serverless functions run many instances in parallel; keep each one's
      // share of the database's connection limit small.
      max: process.env.VERCEL ? 3 : 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return global.__meridianPool;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// --- Row mapping -----------------------------------------------------------
// One SELECT shape for users everywhere, so password_hash never leaves the DB layer.
export const USER_SELECT = `
  SELECT u.id, u.name, u.username, u.email, u.department, u.created_at,
         d.is_hr_flow,
         r.o, r.c, r.e, r.a, r.n, r.completed_at
  FROM users u
  JOIN departments d ON d.name = u.department
  LEFT JOIN test_results r ON r.user_id = u.id`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    department: row.department as Department,
    isHrFlow: row.is_hr_flow,
    createdAt: new Date(row.created_at).toISOString(),
    result:
      row.o == null
        ? undefined
        : {
            scores: { O: row.o, C: row.c, E: row.e, A: row.a, N: row.n },
            completedAt: new Date(row.completed_at).toISOString(),
          },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toEmail(row: any): EmailLogEntry {
  return {
    id: row.id,
    toUserId: row.to_user_id ?? "",
    toEmail: row.to_email,
    subject: row.subject,
    body: row.body,
    sentAt: new Date(row.sent_at).toISOString(),
    sentBy: row.sent_by,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDashboard(row: any): SavedDashboard {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    url: row.url,
    file: row.file_name ? { name: row.file_name, type: row.file_type ?? "", size: Number(row.file_size ?? 0) } : undefined,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    createdBy: row.created_by,
  };
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { rows } = await pool().query(`${USER_SELECT} WHERE u.id = $1`, [id]);
  return rows[0] ? toUser(rows[0]) : undefined;
}

// Employees (non Flow-2 accounts) a Flow-2 viewer may see, scoped by role.
export async function getScopedEmployees(viewer: User): Promise<User[]> {
  const scope = getViewableDepartments(viewer.department);
  const { rows } =
    scope === "all"
      ? await pool().query(`${USER_SELECT} WHERE NOT d.is_hr_flow ORDER BY u.id`)
      : await pool().query(`${USER_SELECT} WHERE NOT d.is_hr_flow AND u.department = ANY($1) ORDER BY u.id`, [scope]);
  return rows.map(toUser);
}
