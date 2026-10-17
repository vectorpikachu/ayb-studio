import { randomUUID } from "node:crypto";
import type { WritingRecord, WritingStatus } from "./db-types";
import { readDatabase, updateDatabase } from "./db";

export type WritingInput = {
  title: string;
  titleZh: string;
  body: string;
  translation: string;
  tags: string[];
  status: WritingStatus;
};

const MAX_WRITINGS_PER_USER = 200;

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 8);
}

function writingOrder(left: WritingRecord, right: WritingRecord) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

export async function listWritingsForUser(userId: string): Promise<WritingRecord[]> {
  const database = await readDatabase();
  return database.writings
    .filter((writing) => writing.userId === userId)
    .slice()
    .sort(writingOrder);
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

  await updateDatabase((database) => {
    const count = database.writings.filter((item) => item.userId === userId).length;
    if (count >= MAX_WRITINGS_PER_USER) throw new Error("WRITING_LIMIT");
    database.writings.push(writing);
    if (writing.status === "final") {
      database.activities.push({
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

  return updateDatabase((database) => {
    const writing = database.writings.find(
      (candidate) => candidate.id === writingId && candidate.userId === userId,
    );
    if (!writing) return null;

    const nextBody = patch.body ?? writing.body;
    const nextStatus = patch.status ?? writing.status;
    if (nextStatus === "final" && !nextBody.trim()) {
      throw new Error("EMPTY_BODY");
    }

    const previousStatus = writing.status;
    if (patch.title !== undefined) writing.title = patch.title.trim();
    if (patch.titleZh !== undefined) writing.titleZh = patch.titleZh.trim();
    if (patch.body !== undefined) writing.body = patch.body;
    if (patch.translation !== undefined) writing.translation = patch.translation;
    if (patch.tags !== undefined) writing.tags = normalizeTags(patch.tags);
    if (patch.status !== undefined) writing.status = patch.status;
    writing.updatedAt = now;

    if (previousStatus !== "final" && writing.status === "final") {
      database.activities.push({
        id: randomUUID(),
        userId,
        type: "writing",
        at: now,
        meta: { writingId: writing.id, status: "final" },
      });
      if (database.activities.length > 20_000) {
        database.activities = database.activities.slice(-10_000);
      }
    }

    return { ...writing };
  });
}

export async function deleteWritingForUser(userId: string, writingId: string): Promise<boolean> {
  return updateDatabase((database) => {
    const index = database.writings.findIndex(
      (writing) => writing.id === writingId && writing.userId === userId,
    );
    if (index === -1) return false;
    database.writings.splice(index, 1);
    return true;
  });
}
