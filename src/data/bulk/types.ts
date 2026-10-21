import type { CategoryId, WordExample, WordLevel } from "../dictionary/types";

export type BulkWord = {
  id: string;
  hy: string;
  translit: string;
  en: string;
  pos: string;
  level: WordLevel;
  category: CategoryId;
  rank: number;
  zh: string;
  ru: string;
  example: WordExample;
};
