import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import type { Role, User } from "./types";

export const SESSION_COOKIE = "yohoo_session";
const SESSION_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function findUserByEmail(email: string): (User & { password_hash: string }) | null {
  const db = getDb();
  return (db
    .prepare("SELECT id, name, email, phone, password_hash, role, created_at FROM users WHERE email = ? COLLATE NOCASE")
    .get(email) as (User & { password_hash: string }) | undefined) ?? null;
}

export function createUser(input: {
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
}): User {
  const db = getDb();
  const now = new Date().toISOString();
  const id = `usr_${randomBytes(12).toString("hex")}`;
  db.prepare(
    "INSERT INTO users (id, name, email, phone, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'GUEST', ?, ?)",
  ).run(id, input.name, input.email.toLowerCase(), input.phone ?? null, input.passwordHash, now, now);
  return { id, name: input.name, email: input.email.toLowerCase(), phone: input.phone ?? null, role: "GUEST", created_at: now };
}

export async function establishSession(userId: string): Promise<void> {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const id = hashToken(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const now = new Date().toISOString();

  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    userId,
    expires.toISOString(),
    now,
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
  }
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), new Date().toISOString()) as User | undefined;
  return row ?? null;
}

export async function requireUser(nextPath = "/account/bookings"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/account/bookings?error=forbidden");
  return user;
}

export function homeForRole(role: Role): string {
  return role === "ADMIN" ? "/admin" : "/rooms";
}
