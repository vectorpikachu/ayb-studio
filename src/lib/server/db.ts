import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Database } from "./db-types";
import { buildSeedDatabase } from "./seed";

const DATA_DIR = path.resolve(process.env.AYB_DATA_DIR ?? path.join(process.cwd(), ".data"));
const DATABASE_FILE = path.join(DATA_DIR, "ayb.db.json");

type DatabaseGlobalState = {
  queue: Promise<unknown>;
  init?: Promise<void>;
};

const globalState = globalThis as typeof globalThis & {
  __aybDatabaseState?: DatabaseGlobalState;
};

const state: DatabaseGlobalState = (globalState.__aybDatabaseState ??= {
  queue: Promise.resolve(),
});

async function exists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function writeDatabaseFile(database: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = path.join(DATA_DIR, `.ayb-${process.pid}-${randomUUID()}.tmp`);
  await fs.writeFile(tempFile, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  await fs.rename(tempFile, DATABASE_FILE);
}

async function ensureDatabase() {
  if (await exists(DATABASE_FILE)) return;
  if (!state.init) {
    state.init = (async () => {
      if (await exists(DATABASE_FILE)) return;
      const seeded = await buildSeedDatabase();
      await writeDatabaseFile(seeded);
    })().finally(() => {
      state.init = undefined;
    });
  }
  await state.init;
}

async function readDatabaseFile(): Promise<Database> {
  const raw = await fs.readFile(DATABASE_FILE, "utf8");
  try {
    return normalizeDatabase(JSON.parse(raw) as Database);
  } catch {
    throw new Error(
      `Ayb 数据库文件损坏，无法解析。请检查 ${DATABASE_FILE}，或恢复到备份。`,
    );
  }
}

/**
 * Keeps older local databases compatible when new fields are introduced.
 * These defaults intentionally stay in memory; the next write persists them.
 */
function normalizeDatabase(database: Database): Database {
  if (!Array.isArray(database.customWords)) database.customWords = [];
  if (!Array.isArray(database.customLessons)) database.customLessons = [];

  let hasAdmin = false;
  for (const user of database.users) {
    if (user.role !== "admin" && user.role !== "learner") user.role = "learner";
    if (user.role === "admin") hasAdmin = true;
  }
  if (database.users.length > 0 && !hasAdmin) {
    database.users[0]!.role = "admin";
  }

  return database;
}

export async function readDatabase(): Promise<Database> {
  await ensureDatabase();
  return readDatabaseFile();
}

export async function updateDatabase<T>(
  updater: (database: Database) => T | Promise<T>,
): Promise<T> {
  await ensureDatabase();

  const previous = state.queue;
  let release: () => void = () => {};
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  state.queue = previous.then(
    () => current,
    () => current,
  );

  await previous.catch(() => undefined);
  try {
    const database = await readDatabaseFile();
    const result = await updater(database);
    await writeDatabaseFile(database);
    return result;
  } finally {
    release();
  }
}

export async function pruneExpiredSessions(now = new Date()): Promise<void> {
  await updateDatabase((database) => {
    const current = now.getTime();
    database.sessions = database.sessions.filter(
      (session) => new Date(session.expiresAt).getTime() > current,
    );
  });
}

export const databaseLocation = DATABASE_FILE;
