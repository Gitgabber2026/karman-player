import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL не задан. См. .env.example");
  process.exit(1);
}
async function main(sql: postgres.Sql) {
  await sql`CREATE EXTENSION IF NOT EXISTS postgis`;
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("✓ migrations applied");
}
const sql = postgres(url, { max: 1, onnotice: () => {} });
main(sql)
  .then(() => sql.end())
  .catch(async (e) => {
    console.error(e);
    await sql.end();
    process.exit(1);
  });
