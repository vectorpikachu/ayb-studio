import type { DictionaryWord } from "@/data/dictionary/types";
import type { ReviewState } from "./srs";

export type ReviewSessionCard = {
  wordId: string;
  word: DictionaryWord;
  isNew: boolean;
  state: ReviewState | null;
};

export type ReviewOverview = {
  dueCount: number;
  newCount: number;
  learnedCount: number;
  totalWords: number;
  streak: number;
  reviewedToday: number;
  totalReviews: number;
  grammarCompleted: number;
  grammarTotal: number;
  writingCount: number;
};

export type ReviewSessionPayload = {
  cards: ReviewSessionCard[];
  overview: ReviewOverview;
};
