import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let cached: { db: Db; sql: postgres.Sql } | null = null;

/** Возвращает подключение к БД или null, если DATABASE_URL не задан. */
export function getDb(): Db | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!cached) {
    const sql = postgres(url, { max: 5, idle_timeout: 20, prepare: false });
    cached = { sql, db: drizzle(sql, { schema }) };
  }
  return cached.db;
}

export async function closeDb() {
  if (cached) {
    await cached.sql.end();
    cached = null;
  }
}
