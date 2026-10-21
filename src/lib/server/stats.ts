import type { ReviewOverview } from "@/lib/review-types";
import { getContentGrammarLessons } from "./content";
import { getDb } from "./db";
import { countWords } from "./word-db";

function dateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.AYB_TIMEZONE || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const VALID_REVIEW_WORD = `
  (
    EXISTS (SELECT 1 FROM words w WHERE w.id = rs.word_id)
    OR EXISTS (SELECT 1 FROM word_overrides o WHERE o.id = rs.word_id)
  )
`;

export async function getLearnerOverview(userId: string): Promise<ReviewOverview> {
  const [db, totalWords, lessons] = await Promise.all([
    getDb(),
    countWords(),
    getContentGrammarLessons(),
  ]);

  const learnedRow = db
    .prepare(`
      SELECT COUNT(*) AS n FROM review_states rs
      WHERE rs.user_id = ? AND ${VALID_REVIEW_WORD}
    `)
    .get(userId) as { n: number } | undefined;
  const learnedCount = Number(learnedRow?.n ?? 0);

  const dueRow = db
    .prepare(`
      SELECT COUNT(*) AS n FROM review_states rs
      WHERE rs.user_id = ? AND rs.due <= ? AND ${VALID_REVIEW_WORD}
    `)
    .get(userId, new Date().toISOString()) as { n: number } | undefined;

  const knownLessonIds = new Set(lessons.map((lesson) => lesson.id));
  const progressRows = db
    .prepare("SELECT lesson_id AS lessonId FROM grammar_progress WHERE user_id = ?")
    .all(userId) as { lessonId: string }[];
  const grammarCompleted = progressRows.filter((row) =>
    knownLessonIds.has(row.lessonId),
  ).length;

  const writingRow = db
    .prepare("SELECT COUNT(*) AS n FROM writings WHERE user_id = ?")
    .get(userId) as { n: number } | undefined;

  const activities = db
    .prepare("SELECT type, at FROM activities WHERE user_id = ?")
    .all(userId) as { type: string; at: string }[];

  const activeDays = new Set(activities.map((activity) => dateKey(new Date(activity.at))));
  const today = new Date();
  const todayKey = dateKey(today);

  let streak = 0;
  const cursor = new Date(today);
  if (!activeDays.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const reviewedToday = activities.filter(
    (activity) => activity.type === "review" && dateKey(new Date(activity.at)) === todayKey,
  ).length;

  return {
    dueCount: Number(dueRow?.n ?? 0),
    newCount: Math.max(0, totalWords - learnedCount),
    learnedCount,
    totalWords,
    streak,
    reviewedToday,
    totalReviews: activities.filter((activity) => activity.type === "review").length,
    grammarCompleted,
    grammarTotal: knownLessonIds.size,
    writingCount: Number(writingRow?.n ?? 0),
  };
}
