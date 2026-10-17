import { randomUUID } from "node:crypto";
import { getGrammarLesson } from "@/data/grammar";
import type { GrammarProgress } from "./db-types";
import { readDatabase, updateDatabase } from "./db";

export async function getGrammarProgressMap(
  userId: string,
): Promise<Record<string, GrammarProgress>> {
  const database = await readDatabase();
  return database.grammarProgress[userId] ?? {};
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
  const lesson = getGrammarLesson(lessonId);
  if (!lesson) throw new Error("UNKNOWN_LESSON");
  if (answers.length !== lesson.quiz.length) throw new Error("INVALID_ANSWERS");

  const total = lesson.quiz.length;
  const score = lesson.quiz.reduce(
    (sum, question, index) => (answers[index] === question.answer ? sum + 1 : sum),
    0,
  );
  const passed = score / total >= 0.6;
  const now = new Date().toISOString();

  if (!passed) {
    const database = await readDatabase();
    return {
      passed: false,
      score,
      total,
      progress: database.grammarProgress[userId]?.[lessonId] ?? null,
    };
  }

  const progress = await updateDatabase((database) => {
    const previous = database.grammarProgress[userId]?.[lessonId];
    const record: GrammarProgress = {
      completedAt: now,
      score: Math.max(previous?.score ?? 0, score),
      total,
    };
    database.grammarProgress[userId] ??= {};
    database.grammarProgress[userId][lessonId] = record;
    database.activities.push({
      id: randomUUID(),
      userId,
      type: "grammar",
      at: now,
      meta: { lessonId, score },
    });
    if (database.activities.length > 20_000) {
      database.activities = database.activities.slice(-10_000);
    }
    return record;
  });

  return { passed: true, score, total, progress };
}
