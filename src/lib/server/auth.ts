import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { SessionUser, UserRole } from "@/lib/auth-types";
import { withWrite, getDb } from "./db";
import type { UserRecord } from "./db-types";
import { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "ayb_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/**
 * Cookie 的 Secure 属性开关。
 * - auto（默认）：按请求实际协议判断，HTTPS 才加 Secure，便于备案前用 HTTP/IP 访问；
 * - always：强制加 Secure，正式上线走 HTTPS 后建议显式设置；
 * - never：强制不加 Secure，仅限内网或调试。
 * 通过环境变量 AYB_COOKIE_SECURE 切换（true/false 分别等同 always/never）。
 */
export type CookieSecureMode = "auto" | "always" | "never";

export function cookieSecureMode(): CookieSecureMode {
  const raw = process.env.AYB_COOKIE_SECURE?.trim().toLowerCase();
  if (raw === "true" || raw === "always") return "always";
  if (raw === "false" || raw === "never") return "never";
  return "auto";
}

function isHttpsRequest(request?: Request): boolean {
  if (!request) return process.env.NODE_ENV === "production";
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim().toLowerCase() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function sessionCookieOptions(request?: Request) {
  const mode = cookieSecureMode();
  const secure =
    mode === "always" ? true : mode === "never" ? false : isHttpsRequest(request);
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
};

const USER_COLUMNS = `
  id, name, email, password_hash AS passwordHash, role, created_at AS createdAt
`;

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role === "admin" ? "admin" : "learner",
    createdAt: row.createdAt,
  };
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await getDb();
  const row = db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`)
    .get(normalizeEmail(email)) as unknown as UserRow | undefined;
  return row ? toUserRecord(row) : null;
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? toSessionUser(user) : null;
}

export type RegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "EMAIL_TAKEN" };

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const configuredAdmin = process.env.AYB_ADMIN_EMAIL?.trim().toLowerCase();

  const createdUser = await withWrite((db) => {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return null;

    const adminRow = db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
      .get() as { n: number } | undefined;
    const hasAdmin = Number(adminRow?.n ?? 0) > 0;
    const role: UserRole = configuredAdmin === email || !hasAdmin ? "admin" : "learner";
    const user: UserRecord = {
      id: randomUUID(),
      name: input.name.trim(),
      email,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt);

    return user;
  });

  if (!createdUser) return { ok: false, reason: "EMAIL_TAKEN" };
  return { ok: true, user: toSessionUser(createdUser) };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();

  await withWrite((db) => {
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now.toISOString());
    db.prepare(`
      INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(tokenHash, userId, now.toISOString(), expiresAt);
  });

  return token;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  if (!token) return;
  const tokenHash = hashToken(token);
  await withWrite((db) => {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
  });
}

export async function getSessionUserFromToken(token: string): Promise<SessionUser | null> {
  if (!token) return null;
  const db = await getDb();
  const row = db
    .prepare(`
      SELECT u.id, u.name, u.email, u.role, u.created_at AS createdAt
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `)
    .get(hashToken(token), new Date().toISOString()) as unknown as
    | Omit<UserRow, "passwordHash">
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role === "admin" ? "admin" : "learner",
    createdAt: row.createdAt,
  };
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUserFromToken(token);
});
