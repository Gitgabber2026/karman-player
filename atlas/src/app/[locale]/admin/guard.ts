import { redirect } from "next/navigation";
import { getSession, hasRole, type Role } from "@/lib/auth";
import { getDb } from "@/db/client";

export async function guard(locale: string, min: Role) {
  const session = await getSession();
  if (!getDb() || !hasRole(session, min)) redirect(`/${locale}/admin`);
  return session!;
}
