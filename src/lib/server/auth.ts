import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { SessionUser } from "@/lib/auth-types";
import { readDatabase, updateDatabase } from "./db";
import type { UserRecord } from "./db-types";
import { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "ayb_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
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
  const database = await readDatabase();
  const normalized = normalizeEmail(email);
  return database.users.find((user) => user.email === normalized) ?? null;
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
  const existing = await findUserByEmail(email);
  if (existing) return { ok: false, reason: "EMAIL_TAKEN" };

  const passwordHash = await hashPassword(input.password);
  const user: UserRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    email,
    passwordHash,
    role: "learner",
    createdAt: new Date().toISOString(),
  };

  const result = await updateDatabase<{ created: boolean; user?: UserRecord }>((database) => {
    if (database.users.some((candidate) => candidate.email === email)) {
      return { created: false };
    }

    const configuredAdmin = process.env.AYB_ADMIN_EMAIL?.trim().toLowerCase();
    const hasAdmin = database.users.some((candidate) => candidate.role === "admin");
    const createdUser: UserRecord = {
      ...user,
      role: configuredAdmin === email || !hasAdmin ? "admin" : "learner",
    };
    database.users.push(createdUser);
    return { created: true, user: createdUser };
  });

  if (!result.created || !result.user) return { ok: false, reason: "EMAIL_TAKEN" };
  return { ok: true, user: toSessionUser(result.user) };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();

  await updateDatabase((database) => {
    database.sessions = database.sessions.filter(
      (session) => new Date(session.expiresAt).getTime() > now.getTime(),
    );
    database.sessions.push({
      tokenHash,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    });
  });

  return token;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  if (!token) return;
  const tokenHash = hashToken(token);
  await updateDatabase((database) => {
    database.sessions = database.sessions.filter((session) => session.tokenHash !== tokenHash);
  });
}

export async function getSessionUserFromToken(token: string): Promise<SessionUser | null> {
  if (!token) return null;
  const database = await readDatabase();
  const tokenHash = hashToken(token);
  const session = database.sessions.find((candidate) => candidate.tokenHash === tokenHash);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
  const user = database.users.find((candidate) => candidate.id === session.userId);
  return user ? toSessionUser(user) : null;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUserFromToken(token);
});
