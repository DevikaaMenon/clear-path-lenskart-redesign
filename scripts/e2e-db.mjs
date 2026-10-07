// Creates a fresh, seeded database for end-to-end tests (cross-platform, no shell scripts).
// Runs before the e2e server starts, so the server never sees a missing table.
//
// Safety: this only ever touches the dedicated test fixture prisma/e2e.db (hard-coded),
// never prisma/dev.db. Instead of the destructive `db push --force-reset`, it removes
// the old fixture file and runs a plain `db push` into a new, empty database.
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const DB_FILE = join(process.cwd(), "prisma", "e2e.db");
for (const f of [DB_FILE, `${DB_FILE}-journal`]) {
  if (existsSync(f)) rmSync(f);
}

const env = { ...process.env, DATABASE_URL: "file:./e2e.db" };
execSync("npx prisma db push --skip-generate", { stdio: "inherit", env });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });
