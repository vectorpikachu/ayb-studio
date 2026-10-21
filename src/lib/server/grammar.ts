import { randomUUID } from "node:crypto";
import type { GrammarProgress } from "./db-types";
import { getDb, insertActivityRecord, withWrite } from "./db";
import { getContentGrammarLesson } from "./content";

type GrammarProgressRow = {
  lessonId: string;
  completedAt: string;
  score: number;
  total: number;
};

function toProgress(row: GrammarProgressRow): GrammarProgress {
  return {
    completedAt: row.completedAt,
    score: Number(row.score),
    total: Number(row.total),
  };
}

export async function getGrammarProgressMap(
  userId: string,
): Promise<Record<string, GrammarProgress>> {
  const db = await getDb();
  const rows = db
    .prepare(`
      SELECT lesson_id AS lessonId, completed_at AS completedAt, score, total
      FROM grammar_progress
      WHERE user_id = ?
    `)
    .all(userId) as unknown as GrammarProgressRow[];
  return Object.fromEntries(rows.map((row) => [row.lessonId, toProgress(row)]));
}

async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<GrammarProgress | null> {
  const db = await getDb();
  const row = db
    .prepare(`
      SELECT lesson_id AS lessonId, completed_at AS completedAt, score, total
      FROM grammar_progress
      WHERE user_id = ? AND lesson_id = ?
    `)
    .get(userId, lessonId) as unknown as GrammarProgressRow | undefined;
  return row ? toProgress(row) : null;
}

export type GrammarAttemptResult = {
  passed: boolean;
  score: number;
  total: number;
  progress: GrammarProgress | null;
};

export async function submitGrammarQuiz(
  userId: string,
  lessonId: string,
  answers: number[],
): Promise<GrammarAttemptResult> {
  const lesson = await getContentGrammarLesson(lessonId);
  if (!lesson) throw new Error("UNKNOWN_LESSON");
  if (lesson.quiz.length === 0 || answers.length !== lesson.quiz.length) {
    throw new Error("INVALID_ANSWERS");
  }

  const total = lesson.quiz.length;
  const score = lesson.quiz.reduce(
    (sum, question, index) => (answers[index] === question.answer ? sum + 1 : sum),
    0,
  );
  const passed = score / total >= 0.6;
  if (!passed) {
    return {
      passed: false,
      score,
      total,
      progress: await getLessonProgress(userId, lessonId),
    };
  }

  const now = new Date().toISOString();
  const progress = await withWrite((db) => {
    const previous = db
      .prepare("SELECT score FROM grammar_progress WHERE user_id = ? AND lesson_id = ?")
      .get(userId, lessonId) as { score: number } | undefined;
    const record: GrammarProgress = {
      completedAt: now,
      score: Math.max(Number(previous?.score ?? 0), score),
      total,
    };

    db.prepare(`
      INSERT INTO grammar_progress (user_id, lesson_id, completed_at, score, total)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET
        completed_at = excluded.completed_at,
        score = excluded.score,
        total = excluded.total
    `).run(userId, lessonId, record.completedAt, record.score, record.total);

    insertActivityRecord(db, {
      id: randomUUID(),
      userId,
      type: "grammar",
      at: now,
      meta: { lessonId, score },
    });

    return record;
  });

  return { passed: true, score, total, progress };
}
