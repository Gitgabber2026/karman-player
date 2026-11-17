import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type Role = "admin" | "editor" | "researcher" | "user";
export interface Session { userId: string; email: string; role: Role; exp: number }

const COOKIE = "emwa_session";
const TTL_S = 60 * 60 * 12;
const RANK: Record<Role, number> = { user: 0, researcher: 1, editor: 2, admin: 3 };

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false;
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, a.length);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET (не менее 32 символов) не задан");
  return s;
}

export const authConfigured = () => (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32;

export function signSession(s: Session): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readSession(token: string | undefined, now = Date.now()): Session | null {
  if (!token || !authConfigured()) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  if (expected.length !== mac.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(mac))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    return s.exp * 1000 > now ? s : null;
  } catch {
    return null;
  }
}

export const hasRole = (s: Session | null, min: Role) => !!s && RANK[s.role] >= RANK[min];

export async function getSession(): Promise<Session | null> {
  return readSession((await cookies()).get(COOKIE)?.value);
}

export async function setSessionCookie(s: Omit<Session, "exp">) {
  (await cookies()).set(COOKIE, signSession({ ...s, exp: Math.floor(Date.now() / 1000) + TTL_S }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL_S,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(COOKIE, "", { path: "/", maxAge: 0 });
}
