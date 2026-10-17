import { getWordById, words } from "@/data/dictionary";
import { grammarLessons } from "@/data/grammar";
import type { ReviewOverview } from "@/lib/review-types";
import type { Database } from "./db-types";
import { readDatabase } from "./db";

function dateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.AYB_TIMEZONE || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function buildLearnerOverview(database: Database, userId: string): ReviewOverview {
  const now = Date.now();
  const states = database.reviewStates[userId] ?? {};
  const validStates = Object.entries(states).filter(([wordId]) => Boolean(getWordById(wordId)));
  const dueCount = validStates.filter(
    ([, state]) => new Date(state.due).getTime() <= now,
  ).length;
  const learnedCount = validStates.length;

  const activities = database.activities.filter((activity) => activity.userId === userId);
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

  const grammarProgress = database.grammarProgress[userId] ?? {};
  const grammarCompleted = grammarLessons.filter((lesson) => Boolean(grammarProgress[lesson.id])).length;

  return {
    dueCount,
    newCount: Math.max(0, words.length - learnedCount),
    learnedCount,
    totalWords: words.length,
    streak,
    reviewedToday,
    totalReviews: activities.filter((activity) => activity.type === "review").length,
    grammarCompleted,
    writingCount: database.writings.filter((writing) => writing.userId === userId).length,
  };
}

export async function getLearnerOverview(userId: string): Promise<ReviewOverview> {
  const database = await readDatabase();
  return buildLearnerOverview(database, userId);
}
