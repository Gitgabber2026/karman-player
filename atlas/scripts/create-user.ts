/** npm run admin:create -- <email> <password> [admin|editor|researcher] */
import postgres from "postgres";
import { scryptSync, randomBytes } from "node:crypto";

const [email, password, role = "admin"] = process.argv.slice(2);
if (!process.env.DATABASE_URL || !email || !password || password.length < 10 || !["admin", "editor", "researcher"].includes(role)) {
  console.error("Использование: DATABASE_URL=… npm run admin:create -- <email> <пароль от 10 символов> [admin|editor|researcher]");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
sql`INSERT INTO users (email, role, password_hash) VALUES (${email.toLowerCase()}, ${role}, ${hash})
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash, updated_at = now()`
  .then(() => console.log(`✓ ${email} (${role})`))
  .finally(() => sql.end());
