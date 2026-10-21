import { promises as fs } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ActivityRecord, LegacyDatabase, SeedSnapshot } from "./db-types";
import { buildSeedSnapshot } from "./seed";
import { insertWordOverride, syncWordSeeds } from "./word-seed";

const SCHEMA_VERSION = 1;
const DATA_DIR = path.resolve(process.env.AYB_DATA_DIR ?? path.join(process.cwd(), ".data"));
const DATABASE_FILE = path.join(DATA_DIR, "ayb.sqlite");
const LEGACY_DATABASE_FILE = path.join(DATA_DIR, "ayb.db.json");

export type CustomContentTable =
  | "custom_lessons"
  | "custom_reading_texts"
  | "custom_culture_entries";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS review_states (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  ease REAL NOT NULL,
  interval_days REAL NOT NULL,
  repetitions INTEGER NOT NULL,
  lapses INTEGER NOT NULL,
  due TEXT NOT NULL,
  last_reviewed TEXT NOT NULL,
  last_grade INTEGER NOT NULL,
  PRIMARY KEY (user_id, word_id)
);
CREATE INDEX IF NOT EXISTS review_states_due_idx ON review_states(user_id, due);

CREATE TABLE IF NOT EXISTS grammar_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS grammar_progress_user_idx ON grammar_progress(user_id);

CREATE TABLE IF NOT EXISTS writings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  body TEXT NOT NULL,
  translation TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS writings_user_updated_idx ON writings(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  at TEXT NOT NULL,
  meta_json TEXT
);
CREATE INDEX IF NOT EXISTS activities_user_at_idx ON activities(user_id, at);
CREATE INDEX IF NOT EXISTS activities_at_idx ON activities(at);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  hy TEXT NOT NULL,
  translit TEXT NOT NULL,
  pos TEXT NOT NULL,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  en TEXT NOT NULL DEFAULT '',
  ru TEXT NOT NULL DEFAULT '',
  zh TEXT NOT NULL DEFAULT '',
  example_json TEXT,
  note TEXT,
  frequency_rank INTEGER,
  sort_order INTEGER NOT NULL,
  source TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS words_hy_idx ON words(hy);

CREATE TABLE IF NOT EXISTS word_overrides (
  id TEXT PRIMARY KEY,
  hy TEXT NOT NULL,
  translit TEXT NOT NULL,
  pos TEXT NOT NULL,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  en TEXT NOT NULL DEFAULT '',
  ru TEXT NOT NULL DEFAULT '',
  zh TEXT NOT NULL DEFAULT '',
  example_json TEXT,
  note TEXT,
  frequency_rank INTEGER,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_lessons (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_reading_texts (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_culture_entries (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

type DatabaseGlobalState = {
  db?: DatabaseSync;
  init?: Promise<DatabaseSync>;
};

const globalState = globalThis as typeof globalThis & {
  __aybSqliteState?: DatabaseGlobalState;
};

const state: DatabaseGlobalState = (globalState.__aybSqliteState ??= {});

function getMeta(db: DatabaseSync, key: string): string | null {
  const row = db
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

function setMeta(db: DatabaseSync, key: string, value: string): void {
  db.prepare(`
    INSERT INTO app_meta (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

function ensureSchema(db: DatabaseSync): void {
  const row = db.prepare("PRAGMA user_version").get() as
    | { user_version?: number }
    | undefined;
  const version = Number(row?.user_version ?? 0);
  if (version > SCHEMA_VERSION) {
    throw new Error(
      `Ayb 数据库版本过新（${version}），当前程序只支持 ${SCHEMA_VERSION}。`,
    );
  }
  if (version < SCHEMA_VERSION) {
    db.exec(SCHEMA_SQL);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

function normalizeLegacyDatabase(raw: unknown): LegacyDatabase {
  if (!raw || typeof raw !== "object") {
    throw new Error("旧数据文件内容不是有效的数据库对象。");
  }

  const database = raw as LegacyDatabase;
  if (!Array.isArray(database.users)) {
    throw new Error("旧数据文件缺少 users 数组。");
  }

  database.sessions ??= [];
  database.reviewStates ??= {};
  database.grammarProgress ??= {};
  database.writings ??= [];
  database.activities ??= [];
  database.customWords ??= [];
  database.customLessons ??= [];
  database.customReadingTexts ??= [];
  database.customCultureEntries ??= [];

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

async function readLegacyDatabase(): Promise<LegacyDatabase | null> {
  let raw: string;
  try {
    raw = await fs.readFile(LEGACY_DATABASE_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }

  try {
    return normalizeLegacyDatabase(JSON.parse(raw));
  } catch (error) {
    throw new Error(
      `无法读取旧数据库 ${LEGACY_DATABASE_FILE}。原文件未改动，请修复或移走后重试。`,
      { cause: error },
    );
  }
}

function insertSnapshot(
  db: DatabaseSync,
  snapshot: SeedSnapshot,
  legacy: LegacyDatabase | null,
): void {
  const now = new Date().toISOString();
  const userIds = new Set<string>();

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const user of snapshot.users) {
    if (userIds.has(user.id)) continue;
    insertUser.run(
      user.id,
      user.name,
      user.email,
      user.passwordHash,
      user.role,
      user.createdAt,
    );
    userIds.add(user.id);
  }

  const insertSession = db.prepare(`
    INSERT OR IGNORE INTO sessions (token_hash, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  for (const session of snapshot.sessions) {
    if (!userIds.has(session.userId)) continue;
    insertSession.run(session.tokenHash, session.userId, session.createdAt, session.expiresAt);
  }

  const insertReviewState = db.prepare(`
    INSERT OR REPLACE INTO review_states (
      user_id, word_id, ease, interval_days, repetitions, lapses,
      due, last_reviewed, last_grade
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const [userId, states] of Object.entries(snapshot.reviewStates)) {
    if (!userIds.has(userId)) continue;
    for (const [wordId, review] of Object.entries(states)) {
      insertReviewState.run(
        userId,
        wordId,
        review.ease,
        review.interval,
        review.repetitions,
        review.lapses,
        review.due,
        review.lastReviewed,
        review.lastGrade,
      );
    }
  }

  const insertGrammarProgress = db.prepare(`
    INSERT OR REPLACE INTO grammar_progress (
      user_id, lesson_id, completed_at, score, total
    ) VALUES (?, ?, ?, ?, ?)
  `);
  for (const [userId, progressMap] of Object.entries(snapshot.grammarProgress)) {
    if (!userIds.has(userId)) continue;
    for (const [lessonId, progress] of Object.entries(progressMap)) {
      insertGrammarProgress.run(
        userId,
        lessonId,
        progress.completedAt,
        progress.score,
        progress.total,
      );
    }
  }

  const insertWriting = db.prepare(`
    INSERT OR REPLACE INTO writings (
      id, user_id, title, title_zh, body, translation, tags_json,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const writing of snapshot.writings) {
    if (!userIds.has(writing.userId)) continue;
    insertWriting.run(
      writing.id,
      writing.userId,
      writing.title,
      writing.titleZh,
      writing.body,
      writing.translation,
      JSON.stringify(writing.tags ?? []),
      writing.status,
      writing.createdAt,
      writing.updatedAt,
    );
  }

  const insertActivity = db.prepare(`
    INSERT INTO activities (id, user_id, type, at, meta_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const activity of snapshot.activities) {
    if (!userIds.has(activity.userId)) continue;
    insertActivity.run(
      activity.id,
      activity.userId,
      activity.type,
      activity.at,
      activity.meta ? JSON.stringify(activity.meta) : null,
    );
  }

  for (const word of legacy?.customWords ?? []) {
    insertWordOverride(db, word, now);
  }

  const insertPayload = (table: CustomContentTable, id: string, payload: unknown) => {
    db.prepare(`
      INSERT INTO ${table} (id, payload_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).run(id, JSON.stringify(payload), now);
  };

  for (const lesson of legacy?.customLessons ?? []) {
    insertPayload("custom_lessons", lesson.id, lesson);
  }
  for (const text of legacy?.customReadingTexts ?? []) {
    insertPayload("custom_reading_texts", text.id, text);
  }
  for (const entry of legacy?.customCultureEntries ?? []) {
    insertPayload("custom_culture_entries", entry.id, entry);
  }

  trimActivities(db);
}

export function withTransaction<T>(db: DatabaseSync, action: (db: DatabaseSync) => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = action(db);
    if (result && typeof (result as { then?: unknown }).then === "function") {
      throw new Error("SQLite 写事务回调必须是同步函数。");
    }
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Preserve the original error.
    }
    throw error;
  }
}

async function initialize(): Promise<DatabaseSync> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "Ayb 数据库不能在 next build 期间初始化；请把读取数据库的页面设为动态渲染。",
    );
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DATABASE_FILE);

  try {
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec("PRAGMA busy_timeout = 5000");
    db.exec("PRAGMA synchronous = NORMAL");
    ensureSchema(db);

    if (getMeta(db, "initialized") !== "1") {
      const legacy = await readLegacyDatabase();
      const snapshot = legacy ?? (await buildSeedSnapshot());
      withTransaction(db, () => {
        insertSnapshot(db, snapshot, legacy);
        setMeta(db, "initialized", "1");
        setMeta(db, "initialized_at", new Date().toISOString());
        setMeta(db, "initialized_from", legacy ? "legacy-json" : "seed");
      });
    }

    syncWordSeeds(db);
    return db;
  } catch (error) {
    try {
      db.close();
    } catch {
      // Preserve the original error.
    }
    throw error;
  }
}

export async function getDb(): Promise<DatabaseSync> {
  if (state.db) return state.db;
  state.init ??= initialize()
    .then((db) => {
      state.db = db;
      return db;
    })
    .finally(() => {
      state.init = undefined;
    });
  return state.init;
}

export async function withWrite<T>(action: (db: DatabaseSync) => T): Promise<T> {
  const db = await getDb();
  return withTransaction(db, action);
}

export function trimActivities(db: DatabaseSync): void {
  const row = db.prepare("SELECT COUNT(*) AS n FROM activities").get() as
    | { n: number }
    | undefined;
  if (Number(row?.n ?? 0) <= 20_000) return;
  db.exec(`
    DELETE FROM activities WHERE rowid NOT IN (
      SELECT rowid FROM activities ORDER BY at DESC, rowid DESC LIMIT 10000
    )
  `);
}

export function insertActivityRecord(db: DatabaseSync, activity: ActivityRecord): void {
  db.prepare(`
    INSERT INTO activities (id, user_id, type, at, meta_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    activity.id,
    activity.userId,
    activity.type,
    activity.at,
    activity.meta ? JSON.stringify(activity.meta) : null,
  );
  trimActivities(db);
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  const row = db.prepare("SELECT COUNT(*) AS n FROM users").get() as
    | { n: number }
    | undefined;
  return Number(row?.n ?? 0);
}

export async function listCustomPayloads<T>(table: CustomContentTable): Promise<T[]> {
  const db = await getDb();
  const rows = db
    .prepare(`SELECT id, payload_json AS payloadJson FROM ${table} ORDER BY rowid`)
    .all() as { id: string; payloadJson: string }[];
  return rows.map((row) => {
    try {
      return JSON.parse(row.payloadJson) as T;
    } catch (error) {
      throw new Error(`自定义内容 ${table}/${row.id} 的 JSON 已损坏。`, { cause: error });
    }
  });
}
