export type ReadingLevel = "A1" | "A2" | "B1" | "B2";

export type ReadingParagraph = {
  hy: string;
  zh: string;
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

export type ReadingText = {
  id: string;
  order: number;
  level: ReadingLevel;
  minutes: number;
  title: string;
  titleHy: string;
  subtitle: string;
  description: string;
  paragraphs: ReadingParagraph[];
  vocabulary: ReadingWord[];
  grammarPoints: ReadingGrammarPoint[];
  takeaways: string[];
};
