import { randomUUID } from "node:crypto";
import type { WritingRecord, WritingStatus } from "./db-types";
import { getDb, insertActivityRecord, withWrite } from "./db";

export type WritingInput = {
  title: string;
  titleZh: string;
  body: string;
  translation: string;
  tags: string[];
  status: WritingStatus;
};

const MAX_WRITINGS_PER_USER = 200;

type WritingRow = {
  id: string;
  userId: string;
  title: string;
  titleZh: string;
  body: string;
  translation: string;
  tagsJson: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const WRITING_COLUMNS = `
  id, user_id AS userId, title, title_zh AS titleZh, body, translation,
  tags_json AS tagsJson, status, created_at AS createdAt, updated_at AS updatedAt
`;

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 8);
}

function parseTags(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((tag): tag is string => typeof tag === "string");
  } catch {
    return [];
  }
}

function toWritingRecord(row: WritingRow): WritingRecord {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    titleZh: row.titleZh,
    body: row.body,
    translation: row.translation,
    tags: parseTags(row.tagsJson),
    status: row.status === "final" ? "final" : "draft",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listWritingsForUser(userId: string): Promise<WritingRecord[]> {
  const db = await getDb();
  const rows = db
    .prepare(`
      SELECT ${WRITING_COLUMNS} FROM writings
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `)
    .all(userId) as unknown as WritingRow[];
  return rows.map(toWritingRecord);
}

export async function createWritingForUser(
  userId: string,
  input: WritingInput,
): Promise<WritingRecord> {
  const now = new Date().toISOString();
  const writing: WritingRecord = {
    id: randomUUID(),
    userId,
    title: input.title.trim(),
    titleZh: input.titleZh.trim(),
    body: input.body,
    translation: input.translation,
    tags: normalizeTags(input.tags),
    status: input.status === "final" && !input.body.trim() ? "draft" : input.status,
    createdAt: now,
    updatedAt: now,
  };

  await withWrite((db) => {
    const row = db
      .prepare("SELECT COUNT(*) AS n FROM writings WHERE user_id = ?")
      .get(userId) as { n: number } | undefined;
    if (Number(row?.n ?? 0) >= MAX_WRITINGS_PER_USER) throw new Error("WRITING_LIMIT");

    db.prepare(`
      INSERT INTO writings (
        id, user_id, title, title_zh, body, translation, tags_json,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      writing.id,
      writing.userId,
      writing.title,
      writing.titleZh,
      writing.body,
      writing.translation,
      JSON.stringify(writing.tags),
      writing.status,
      writing.createdAt,
      writing.updatedAt,
    );

    if (writing.status === "final") {
      insertActivityRecord(db, {
        id: randomUUID(),
        userId,
        type: "writing",
        at: now,
        meta: { writingId: writing.id, status: "final" },
      });
    }
  });

  return writing;
}

export async function updateWritingForUser(
  userId: string,
  writingId: string,
  patch: Partial<WritingInput>,
): Promise<WritingRecord | null> {
  const now = new Date().toISOString();

  return withWrite((db) => {
    const row = db
      .prepare(`SELECT ${WRITING_COLUMNS} FROM writings WHERE id = ? AND user_id = ?`)
      .get(writingId, userId) as unknown as WritingRow | undefined;
    if (!row) return null;

    const current = toWritingRecord(row);
    const nextBody = patch.body ?? current.body;
    const nextStatus = patch.status ?? current.status;
    if (nextStatus === "final" && !nextBody.trim()) {
      throw new Error("EMPTY_BODY");
    }

    const previousStatus = current.status;
    const next: WritingRecord = {
      ...current,
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      titleZh: patch.titleZh !== undefined ? patch.titleZh.trim() : current.titleZh,
      body: nextBody,
      translation: patch.translation !== undefined ? patch.translation : current.translation,
      tags: patch.tags !== undefined ? normalizeTags(patch.tags) : current.tags,
      status: nextStatus,
      updatedAt: now,
    };

    db.prepare(`
      UPDATE writings SET
        title = ?, title_zh = ?, body = ?, translation = ?, tags_json = ?,
        status = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      next.title,
      next.titleZh,
      next.body,
      next.translation,
      JSON.stringify(next.tags),
      next.status,
      next.updatedAt,
      writingId,
      userId,
    );

    if (previousStatus !== "final" && next.status === "final") {
      insertActivityRecord(db, {
        id: randomUUID(),
        userId,
        type: "writing",
        at: now,
        meta: { writingId, status: "final" },
      });
    }

    return next;
  });
}

export async function deleteWritingForUser(
  userId: string,
  writingId: string,
): Promise<boolean> {
  return withWrite((db) => {
    const result = db
      .prepare("DELETE FROM writings WHERE id = ? AND user_id = ?")
      .run(writingId, userId);
    return Number(result.changes) > 0;
  });
}
