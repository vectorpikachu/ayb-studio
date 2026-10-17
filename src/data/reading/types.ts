export type ReadingLevel = "A1" | "A2" | "B1" | "B2";

export type ReadingParagraph = {
  hy: string;
  zh: string;
  /** A normalized, present-day Armenian paraphrase for older literary texts. */
  modernHy?: string;
  note?: string;
};

export type ReadingWord = {
  hy: string;
  translit: string;
  zh: string;
  note?: string;
};

export type ReadingGrammarPoint = {
  title: string;
  explanation: string;
  examples: {
    hy: string;
    zh: string;
    note?: string;
  }[];
};

export type ReadingKind = "original" | "excerpt" | "poem";

export type ReadingText = {
  id: string;
  order: number;
  level: ReadingLevel;
  minutes: number;
  title: string;
  titleHy: string;
  subtitle: string;
  description: string;
  author?: string;
  authorHy?: string;
  year?: string;
  kind?: ReadingKind;
  source?: string;
  sourceUrl?: string;
  paragraphs: ReadingParagraph[];
  vocabulary: ReadingWord[];
  grammarPoints: ReadingGrammarPoint[];
  takeaways: string[];
};
