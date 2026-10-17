export type ReviewSessionCard = {
  wordId: string;
  isNew: boolean;
  state: import("./srs").ReviewState | null;
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
  writingCount: number;
};

export type ReviewSessionPayload = {
  cards: ReviewSessionCard[];
  overview: ReviewOverview;
};
