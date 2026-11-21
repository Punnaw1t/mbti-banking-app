// npm run db:check — verify the Postgres database is up and the data looks right.
// Reads DATABASE_URL from the environment or .env.local.
import { readFileSync } from "fs";
import pg from "pg";

function loadEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const line = readFileSync(".env.local", "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL="));
    if (line) return line.slice("DATABASE_URL=".length).trim();
  } catch {}
  return "postgres://meridian:meridian@localhost:5433/meridian";
}

const ok = (m) => console.log(`  \x1b[32m✔\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✘\x1b[0m ${m}`);
let failures = 0;
const check = (cond, pass, fail = pass) => (cond ? ok(pass) : (failures++, bad(fail)));

const client = new pg.Client({ connectionString: loadEnv() });
try {
  await client.connect();
} catch (err) {
  bad(`Can't connect to the database: ${err.message}`);
  console.log("    Start it with: docker compose up -d");
  process.exit(1);
}

console.log("\nConnection");
const { rows: [v] } = await client.query("SELECT current_database() AS db, version() AS version");
ok(`Connected to "${v.db}" (${v.version.split(" ").slice(0, 2).join(" ")})`);

console.log("\nTables");
const tables = ["departments", "users", "test_results", "email_log", "dashboards", "sessions"];
const counts = {};
for (const t of tables) {
  const exists = (await client.query("SELECT to_regclass($1) AS r", [t])).rows[0].r;
  if (!exists) { check(false, "", `Table "${t}" is missing (run: docker compose down -v && docker compose up -d)`); continue; }
  counts[t] = (await client.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
  ok(`${t.padEnd(13)} ${String(counts[t]).padStart(4)} rows`);
}

console.log("\nData integrity");
const q = async (sql) => (await client.query(sql)).rows;
check(counts.departments === 9, "9 departments present", `Expected 9 departments, found ${counts.departments}`);
const orphans = await q("SELECT count(*)::int AS n FROM test_results r LEFT JOIN users u ON u.id = r.user_id WHERE u.id IS NULL");
check(orphans[0].n === 0, "Every test result belongs to a user", `${orphans[0].n} test results without a user`);
const hrResults = await q("SELECT count(*)::int AS n FROM test_results r JOIN users u ON u.id = r.user_id JOIN departments d ON d.name = u.department WHERE d.is_hr_flow");
check(hrResults[0].n === 0, "No HR/management account has an assessment result", `${hrResults[0].n} HR/management accounts have results`);
const dupes = await q("SELECT lower(username) AS u, count(*)::int AS n FROM users GROUP BY 1 HAVING count(*) > 1");
check(dupes.length === 0, "Usernames are unique (case-insensitive)", `Duplicate usernames: ${dupes.map((d) => d.u).join(", ")}`);
const plain = await q("SELECT count(*)::int AS n FROM users WHERE password_hash !~ '^\\$2[aby]\\$'");
check(plain[0].n === 0, "All passwords are bcrypt-hashed", `${plain[0].n} users have a non-bcrypt password`);
const expired = await q("SELECT count(*)::int AS n FROM sessions WHERE expires_at <= now()");
ok(`${expired[0].n} expired session(s)`);

console.log("\nUsers");
console.table(await q(`
  SELECT u.username, u.department,
         CASE WHEN d.is_hr_flow THEN 'Flow 2 (HR)' ELSE 'Flow 1' END AS flow,
         CASE WHEN r.user_id IS NULL THEN '—' ELSE concat_ws('/', r.o, r.c, r.e, r.a, r.n) END AS "O/C/E/A/N"
  FROM users u JOIN departments d ON d.name = u.department
  LEFT JOIN test_results r ON r.user_id = u.id
  ORDER BY d.is_hr_flow, u.department, u.username`));

await client.end();
console.log(failures ? `\n\x1b[31m${failures} check(s) failed.\x1b[0m` : "\n\x1b[32mAll checks passed.\x1b[0m");
process.exit(failures ? 1 : 0);
