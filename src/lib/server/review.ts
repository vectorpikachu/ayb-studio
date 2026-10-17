import { randomUUID } from "node:crypto";
import { dictionaryCategories } from "@/data/dictionary";
import type { DictionaryWord } from "@/data/dictionary/types";
import type { ReviewSessionCard, ReviewSessionPayload } from "@/lib/review-types";
import { scheduleReview, type ReviewGrade, type ReviewState } from "@/lib/srs";
import { getContentWords } from "./content";
import { readDatabase, updateDatabase } from "./db";
import { buildLearnerOverview } from "./stats";

const MAX_DUE_CARDS = 12;
const MAX_NEW_CARDS = 8;

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
  const [database, contentWords] = await Promise.all([readDatabase(), getContentWords()]);
  const states = database.reviewStates[userId] ?? {};
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

  return {
    cards: selected,
    overview: buildLearnerOverview(database, userId),
  };
}

export async function gradeReviewWord(
  userId: string,
  wordId: string,
  grade: ReviewGrade,
): Promise<ReviewState> {
  const contentWords = await getContentWords();
  const word = contentWords.find((candidate) => candidate.id === wordId);
  if (!word) throw new Error("UNKNOWN_WORD");

  const now = new Date();

  return updateDatabase((database) => {
    const previous = database.reviewStates[userId]?.[wordId] ?? null;
    const nextState = scheduleReview(previous, grade, now);

    database.reviewStates[userId] ??= {};
    database.reviewStates[userId][wordId] = nextState;

    database.activities.push({
      id: randomUUID(),
      userId,
      type: "review",
      at: now.toISOString(),
      meta: { wordId, grade },
    });

    if (database.activities.length > 20_000) {
      database.activities = database.activities.slice(-10_000);
    }

    return nextState;
  });
}
