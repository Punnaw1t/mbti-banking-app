// npm run db:setup — create the tables and load the demo data in any Postgres
// (e.g. the Neon / Supabase database used by the Vercel deployment).
// Docker does this automatically for the local DB; hosted databases need it once.
//
//   DATABASE_URL="postgres://…?sslmode=require" npm run db:setup
//
// Safe to re-run: the schema uses IF NOT EXISTS and the seed uses ON CONFLICT DO NOTHING.
import { readFileSync } from "fs";
import pg from "pg";

function databaseUrl() {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return process.env.DATABASE_URL || process.env.POSTGRES_URL;
  try {
    const line = readFileSync(".env.local", "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL="));
    if (line) return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
  } catch {}
  console.error("Set DATABASE_URL (or put it in .env.local) first.");
  process.exit(1);
}

const url = databaseUrl();
const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
} catch (err) {
  console.error(`Can't connect to ${new URL(url).host}: ${err.message}`);
  process.exit(1);
}

for (const file of ["db/init/01_schema.sql", "db/init/02_seed.sql"]) {
  await client.query(readFileSync(file, "utf8"));
  console.log(`  \x1b[32m✔\x1b[0m ${file}`);
}
await client.end();
console.log(`\nDatabase at ${new URL(url).host} is ready. Check it with: npm run db:check`);
