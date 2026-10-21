import type { CategoryId, WordLevel } from "../dictionary/types";

export type BulkWord = {
  id: string;
  hy: string;
  translit: string;
  en: string;
  pos: string;
  level: WordLevel;
  category: CategoryId;
  rank: number;
};
