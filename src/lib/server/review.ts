import { randomUUID } from "node:crypto";
import { dictionaryCategories } from "@/data/dictionary";
import type { DictionaryWord } from "@/data/dictionary/types";
import type { ReviewSessionCard, ReviewSessionPayload } from "@/lib/review-types";
import { scheduleReview, type ReviewGrade, type ReviewState } from "@/lib/srs";
import { getContentWordById, getContentWords } from "./content";
import { getDb, insertActivityRecord, withWrite } from "./db";
import { getLearnerOverview } from "./stats";

const MAX_DUE_CARDS = 12;
const MAX_NEW_CARDS = 8;

type ReviewStateRow = {
  wordId: string;
  ease: number;
  interval: number;
  repetitions: number;
  lapses: number;
  due: string;
  lastReviewed: string;
  lastGrade: number;
};

const REVIEW_STATE_COLUMNS = `
  word_id AS wordId, ease, interval_days AS interval, repetitions, lapses,
  due, last_reviewed AS lastReviewed, last_grade AS lastGrade
`;

function toReviewState(row: ReviewStateRow): ReviewState {
  return {
    ease: Number(row.ease),
    interval: Number(row.interval),
    repetitions: Number(row.repetitions),
    lapses: Number(row.lapses),
    due: row.due,
    lastReviewed: row.lastReviewed,
    lastGrade: (Number(row.lastGrade) === 3
      ? 3
      : Number(row.lastGrade) === 1
        ? 1
        : Number(row.lastGrade) === 0
          ? 0
          : 2) as ReviewGrade,
  };
}

export async function loadReviewStates(
  userId: string,
): Promise<Record<string, ReviewState>> {
  const db = await getDb();
  const rows = db
    .prepare(`SELECT ${REVIEW_STATE_COLUMNS} FROM review_states WHERE user_id = ?`)
    .all(userId) as unknown as ReviewStateRow[];
  return Object.fromEntries(rows.map((row) => [row.wordId, toReviewState(row)]));
}

function isDue(state: ReviewState, now: number) {
  return new Date(state.due).getTime() <= now;
}

function pickNewWords(candidates: DictionaryWord[], limit: number): DictionaryWord[] {
  const byCategory = dictionaryCategories.map((category) =>
    candidates.filter((word) => word.category === category.id),
  );
  const picked: DictionaryWord[] = [];

  while (picked.length < limit) {
    let added = false;
    for (const group of byCategory) {
      const next = group.shift();
      if (!next) continue;
      picked.push(next);
      added = true;
      if (picked.length >= limit) break;
    }
    if (!added) break;
  }

  return picked;
}

export async function createReviewSession(
  userId: string,
  options: { focusWordId?: string } = {},
): Promise<ReviewSessionPayload> {
  const [contentWords, states, overview] = await Promise.all([
    getContentWords(),
    loadReviewStates(userId),
    getLearnerOverview(userId),
  ]);
  const now = Date.now();
  const selected: ReviewSessionCard[] = [];
  const selectedIds = new Set<string>();
  const wordMap = new Map(contentWords.map((word) => [word.id, word]));

  const focusWord = options.focusWordId ? wordMap.get(options.focusWordId) : undefined;
  if (focusWord) {
    selected.push({
      wordId: focusWord.id,
      word: focusWord,
      isNew: !states[focusWord.id],
      state: states[focusWord.id] ?? null,
    });
    selectedIds.add(focusWord.id);
  }

  const dueCards = Object.entries(states)
    .filter(([wordId, state]) => {
      return wordMap.has(wordId) && isDue(state, now) && !selectedIds.has(wordId);
    })
    .sort(([, left], [, right]) => new Date(left.due).getTime() - new Date(right.due).getTime())
    .slice(0, MAX_DUE_CARDS)
    .flatMap(([wordId, state]) => {
      const word = wordMap.get(wordId);
      return word ? [{ wordId, word, isNew: false, state }] : [];
    });

  for (const card of dueCards) {
    if (selectedIds.has(card.wordId)) continue;
    selected.push(card);
    selectedIds.add(card.wordId);
  }

  const newCandidates = contentWords.filter(
    (word) => !states[word.id] && !selectedIds.has(word.id),
  );
  const newCards = pickNewWords(newCandidates, MAX_NEW_CARDS).map((word) => ({
    wordId: word.id,
    word,
    isNew: true,
    state: null,
  }));

  selected.push(...newCards);

  return { cards: selected, overview };
}

export async function gradeReviewWord(
  userId: string,
  wordId: string,
  grade: ReviewGrade,
): Promise<ReviewState> {
  const word = await getContentWordById(wordId);
  if (!word) throw new Error("UNKNOWN_WORD");

  const now = new Date();

  return withWrite((db) => {
    const row = db
      .prepare(`
        SELECT ${REVIEW_STATE_COLUMNS}
        FROM review_states WHERE user_id = ? AND word_id = ?
      `)
      .get(userId, wordId) as unknown as ReviewStateRow | undefined;
    const previous = row ? toReviewState(row) : null;
    const nextState = scheduleReview(previous, grade, now);

    db.prepare(`
      INSERT INTO review_states (
        user_id, word_id, ease, interval_days, repetitions, lapses,
        due, last_reviewed, last_grade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, word_id) DO UPDATE SET
        ease = excluded.ease,
        interval_days = excluded.interval_days,
        repetitions = excluded.repetitions,
        lapses = excluded.lapses,
        due = excluded.due,
        last_reviewed = excluded.last_reviewed,
        last_grade = excluded.last_grade
    `).run(
      userId,
      wordId,
      nextState.ease,
      nextState.interval,
      nextState.repetitions,
      nextState.lapses,
      nextState.due,
      nextState.lastReviewed,
      nextState.lastGrade,
    );

    insertActivityRecord(db, {
      id: randomUUID(),
      userId,
      type: "review",
      at: now.toISOString(),
      meta: { wordId, grade },
    });

    return nextState;
  });
}
