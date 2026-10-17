export type GrammarLevel = "A1" | "A2" | "B1" | "B2";

export type GrammarExample = {
  hy: string;
  translit: string;
  zh: string;
  note?: string;
};

export type GrammarLetter = {
  upper: string;
  lower: string;
  name: string;
  sound: string;
};

export type GrammarBlock =
  | { type: "paragraph"; text: string }
  | { type: "note"; title?: string; text: string }
  | { type: "examples"; items: GrammarExample[] }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "letters"; items: GrammarLetter[] };

export type GrammarSection = {
  id: string;
  title: string;
  blocks: GrammarBlock[];
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type GrammarLesson = {
  id: string;
  order: number;
  level: GrammarLevel;
  minutes: number;
  title: string;
  titleHy: string;
  subtitle: string;
  description: string;
  intro: string;
  sections: GrammarSection[];
  takeaways: string[];
  quiz: QuizQuestion[];
};
